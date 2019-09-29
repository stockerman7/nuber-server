import User from "../../../entities/User";
import Verification from "../../../entities/Verification";
import {
	EmailSignUpMutationArgs,
	EmailSignUpResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import createJWT from "../../../utils/createJWT";
import { sendVerificationEmail } from "../../../utils/sendEmail";

const resolvers: Resolvers = {
	Mutation: {
		EmailSignUp: async (
			_,
			args: EmailSignUpMutationArgs,
		): Promise<EmailSignUpResponse> => {
			const { email } = args;
			// 기존에 있는 사용자는 가입이 아니라 로그인
			// FacebookConnect 을 먼저 했다면 기존 사용자 이기 때문에 새로운 비밀번호가 적용되지 않을 것이다.
			// 나중에 EmailSignIn에서 비교할 비밀번호가 없기 때문에 bcrypt.compare Error 가 발생한다.
			try {
				const existingUser = await User.findOne({ email });
				// console.log("Email 기존 가입자: ", existingUser);
				if (existingUser) {
					return {
						ok: false,
						error: "이미 가입된 사용자, 대신 로그인 합니다.",
						token: null,
					};
				} else {
					// 폰인증 받고 가입했는데 이메일까지 인증/가입을 중복해서 받지 않으려면 확인해야 한다.
					const phoneVerification = await Verification.findOne({
						payload: args.phoneNumber,
						verified: true,
					});
					if (phoneVerification) {
						// 새로 가입한 사용자는 DB 에 저장, { ...args } 를 사용한 이유는 User Scheme 중에 EmailSignUpMutationArgs 에
						// 정의된 Entity(firstName, lastName, email, password, profilePhoto, age, phoneNumber) 만 업데이트 할 것이기 때문
						const newUser = await User.create({ ...args }).save();
						if (newUser.email) {
							const emailVerification = await Verification.create({
								payload: newUser.email,
								target: "EMAIL",
							}).save(); // 생성/수정 시에는 저장한다.
							await sendVerificationEmail(
								newUser.fullName,
								emailVerification.key,
							);
						}
						// console.log("Email 새로운 가입자: ", newUser);
						const token = createJWT(newUser.id);
						return {
							ok: true,
							error: null,
							token,
						};
					} else {
						return {
							ok: false,
							error: "당신의 폰번호는 인증되지 않았습니다.",
							token: null,
						};
					}
				}
			} catch (error) {
				return {
					ok: false,
					error: error.message,
					token: null,
				};
			}
		},
	},
};

export default resolvers;
