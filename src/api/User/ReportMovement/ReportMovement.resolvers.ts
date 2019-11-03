import User from "../../../entities/User";
import {
	ReportMovementMutationArgs,
	ReportMovementResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import cleanNullArgs from "../../../utils/cleanNullArgs";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
	Mutation: {
		ReportMovement: privateResolver(
			async (
				_,
				args: ReportMovementMutationArgs,
				{ req, pubSub }, // #1 context 에 pubSub 연결
			): Promise<ReportMovementResponse> => {
				const user: User = req.user;
				const notNull = cleanNullArgs(args);
				try {
					// #2 사용자 정보를 업데이트 할 때, 업데이트 된 사용자 정보를 다시 가져오고
					await User.update({ id: user.id }, { ...notNull });
					const updatedUser = await User.findOne({ id: user.id });
					// #3 구독자에게 전달한다. 여기선 Driver 가 Passenger 에게 전달한다.
					pubSub.publish("driverUpdate", { DriversSubscription: updatedUser });
					return {
						ok: true,
						error: null,
					};
				} catch (error) {
					return {
						ok: false,
						error: error.message,
					};
				}
			},
		),
	},
};

export default resolvers;
