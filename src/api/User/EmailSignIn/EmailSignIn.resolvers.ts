import User from "../../../entities/User";
import { Resolvers } from "../../../types/resolvers";
import createJWT from "../../../utils/createJWT";
import {
	EmailSignInMutationArgs,
	EmailSignInResponse,
} from "./../../../types/graph";

const resolvers: Resolvers = {
	Mutation: {
		EmailSignIn: async (
			_,
			args: EmailSignInMutationArgs,
		): Promise<EmailSignInResponse> => {
			// 이메일, 비밀번호로 로그인 하니 두개의 인자가 필요하다.
			const { email, password } = args;
			try {
				const existingUser = await User.findOne({ email });
				console.log("Email 기존 사용자:", existingUser);
				if (!existingUser) {
					return {
						ok: false,
						error: "해당되는 이메일이 없습니다.",
						token: null,
					};
				}
				// 비밀번호 확인(비교)
				const checkPassword = await existingUser.comparePassword(password);
				if (checkPassword) {
					const token = createJWT(existingUser.id);
					return {
						ok: true,
						error: null,
						token,
					};
				} else {
					return {
						ok: false,
						error: "잘못된 비밀번호입니다.",
						token: null,
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
