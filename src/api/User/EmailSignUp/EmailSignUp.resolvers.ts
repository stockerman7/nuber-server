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
			// EmailSignUp 보다 FacebookConnect 을 먼저 했다면 기존 사용자기 때문에 새 비밀번호가 적용되지 않을 것이다.
			// 나중에 EmailSignIn에서 비교할 비밀번호가 없기 때문에 bcrypt.compare Error 가 발생한다.
			try {
				const existingUser = await User.findOne({ email });
				if (existingUser) {
					return {
						ok: false,
						error: "이미 가입된 사용자, 대신 로그인 합니다.",
						token: null,
					};
				} else {
					// 폰인증을 받은 사용자만이 이메일 가입이 가능하다.
					const phoneVerification = await Verification.findOne({
						payload: args.phoneNumber,
						verified: true,
					});
					if (phoneVerification) {
						// 새로 가입한 사용자는 DB 에 저장, { ...args } 를 사용한 이유는 User Scheme 중에 EmailSignUpMutationArgs 에
						// 정의된 Entity(firstName, lastName, email, password, profilePhoto, age, phoneNumber) 로 생성될 것이다.
						const newUser = await User.create({ ...args }).save();
						// 이메일을 사용자가 input 했다면 새로운 인증을 받아야 한다.
						if (newUser.email) {
							// 이메일 인증을 생성, 이메일 인증 이력을 저장
							const emailVerification = await Verification.create({
								payload: newUser.email,
								target: "EMAIL",
							}).save();
							// 새로 생성된 이메일 인증키, 그리고 사용자 이름을 전달
							await sendVerificationEmail(
								newUser.fullName,
								emailVerification.key,
							);
						}
						const token = createJWT(newUser.id);
						return {
							ok: true,
							error: null,
							token,
						};
					} else {
						return {
							ok: false,
							error: "인증되지 않은 폰번호 입니다.",
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
