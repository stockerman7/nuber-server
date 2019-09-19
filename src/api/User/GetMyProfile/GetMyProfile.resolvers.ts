import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

// privateResolver 호출은
// GetMyProfile: async (parent, args, context) => {...} 처럼 된다.
const resolvers: Resolvers = {
	Query: {
		GetMyProfile: privateResolver(async (_, __, { req }) => {
			const { user } = req;
			return {
				ok: true,
				error: null,
				user,
			};
		}),
	},
};

export default resolvers;
