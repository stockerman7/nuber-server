import User from "../../../entities/User";
import {
	FacebookConnectMutationArgs,
	FacebookConnectResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";

const resolvers: Resolvers = {
	Mutation: {
		FacebookConnect: async (
			_,
			args: FacebookConnectMutationArgs,
		): Promise<FacebookConnectResponse> => {
			const { fbID } = args;
			try {
				// 먼저 Facebook ID 가 이미 존재하는지 확인
				const existingUser = await User.findOne({ fbID });
				// 이미 로그인한 사용자가 있다면
				if (existingUser) {
					return {
						ok: true,
						error: null,
						token: "Coming Soon",
					};
				}
			} catch (error) {
				return {
					ok: false,
					error: error.message,
					token: null,
				};
			}
			try {
				//
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
