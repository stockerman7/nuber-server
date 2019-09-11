import User from "../../../entities/User";
import { Resolvers } from "../../../types/resolvers";
import {
	EmailSignInMutationArgs,
	EmailSignInResponse,
} from "./../../../types/graph.d";

const resolvers: Resolvers = {
	Mutation: {
		EmailSignIn: async (
			_,
			args: EmailSignInMutationArgs,
		): Promise<EmailSignInResponse> => {
			const { email } = args;
			try {
				const user = await User.findOne({ email });
				if (!user) {
					return {
						ok: false,
						error: "해당되는 이메일이 없습니다.",
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
