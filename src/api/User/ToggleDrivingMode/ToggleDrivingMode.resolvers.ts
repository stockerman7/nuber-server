import User from "../../../entities/User";
import { ToggleDrivingModeResponse } from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
	Mutation: {
		ToggleDrivingMode: privateResolver(
			async (_, __, { req }): Promise<ToggleDrivingModeResponse> => {
				const user: User = req.user;
				user.isDriving = !user.isDriving; // 현재 운전상태 변경
				user.save(); // DB 저장
				return {
					ok: true,
					error: null,
				};
			},
		),
	},
};

export default resolvers;
