import Ride from "../../../entities/Ride";
import User from "../../../entities/User";
import {
	RequestRideMutationArgs,
	RequestRideResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
	Mutation: {
		RequestRide: privateResolver(
			async (
				_,
				args: RequestRideMutationArgs,
				{ req, pubSub },
			): Promise<RequestRideResponse> => {
				const user: User = req.user;
				// 사용자가 탑승중이 아닌 경우에만 탑승이 가능하도록, 중복 탑승은 없다.
				if (!user.isRiding) {
					try {
						const ride = await Ride.create({ ...args, passenger: user }).save();
						pubSub.publish("rideRequest", { NearbyRideSubscription: ride });
						user.isRiding = true;
						user.save();
						return {
							ok: true,
							error: null,
							ride,
						};
					} catch (error) {
						return {
							ok: false,
							error: error.message,
							ride: null,
						};
					}
				} else {
					return {
						ok: false,
						error: "중복 탑승 요청은 할 수 없습니다.",
						ride: null,
					};
				}
			},
		),
	},
};

export default resolvers;
