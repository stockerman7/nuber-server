import User from "../../../entities/User";
import {
	EmailSignUpMutationArgs,
	EmailSignUpResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import createJWT from "../../../utils/createJWT";

const resolvers: Resolvers = {
	Mutation: {
		EmailSignUp: async (
			_,
			args: EmailSignUpMutationArgs,
		): Promise<EmailSignUpResponse> => {
			const { email } = args;
			// 기존에 있는 사용자는 가입이 아니라 로그인
			try {
				const existingUser = await User.findOne({ email });
				console.log("Email 기존 가입자: ", existingUser);
				if (existingUser) {
					return {
						ok: false,
						error: "이미 가입된 사용자, 대신 로그인 합니다.",
						token: null,
					};
				} else {
					// 새로 가입한 사용자는 DB 에 저장, { ...args } 를 사용한 이유는 User Scheme 중에 EmailSignUpMutationArgs 에
					// 정의된 Entity(firstName, lastName, email, password, profilePhoto, age, phoneNumber) 만 업데이트 할 것이기 때문
					const newUser = await User.create({ ...args }).save();
					console.log("Email 새로운 가입자: ", newUser);
					const token = createJWT(newUser.id);
					return {
						ok: true,
						error: null,
						token,
					};
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
