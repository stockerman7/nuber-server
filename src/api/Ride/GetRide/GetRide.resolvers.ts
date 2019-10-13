import Ride from "../../../entities/Ride";
import User from "../../../entities/User";
import { GetRideQueryArgs, GetRideResponse } from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
	Query: {
		GetRide: privateResolver(
			async (_, args: GetRideQueryArgs, { req }): Promise<GetRideResponse> => {
				const user: User = req.user;
				try {
					const ride = await Ride.findOne({
						id: args.rideId,
					});
					if (ride) {
						if (ride.passengerId === user.id || ride.driverId === user.id) {
							return {
								ok: true,
								error: null,
								ride,
							};
						} else {
							return {
								ok: false,
								error: "인증되지 않았습니다.",
								ride: null,
							};
						}
					} else {
						return {
							ok: false,
							error: "탑승을 찾을 수 없습니다.",
							ride: null,
						};
					}
				} catch (error) {
					return {
						ok: false,
						error: error.message,
						ride: null,
					};
				}
			},
		),
	},
};

export default resolvers;
