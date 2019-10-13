import Ride from "../../../entities/Ride";
import User from "../../../entities/User";
import {
	UpdateRideStatusMutationArgs,
	UpdateRideStatusResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
	Mutation: {
		UpdateRideStatus: privateResolver(
			async (
				_,
				args: UpdateRideStatusMutationArgs,
				{ req },
			): Promise<UpdateRideStatusResponse> => {
				const user: User = req.user;
				// 사용자가 운전중인 경우, 즉 사용자가 Driver 인 경우
				// 운전자(Driver)가 탑승한(Ride) 경우와 승객(Passenger)이 탑승한 경우를 따져야 함
				if (user.isDriving) {
					try {
						let ride: Ride | undefined;
						// Driver 가 탑승을 승인(ACCEPTED)할 경우, 기존 상태는 요청(REQUESTING) 상태야 한다.
						if (args.status === "ACCEPTED") {
							ride = await Ride.findOne({
								id: args.rideId,
								status: "REQUESTING",
							});
							if (ride) {
								// 이제 사용자는 Driver 입장이 된다. 사용자 상태 업데이트/저장
                ride.driver = user;
                user.isTaken = true;
                user.save();
							}
						} else {
							ride = await Ride.findOne({
								id: args.rideId,
								driver: user,
							});
						}
						if (ride) {
							ride.status = args.status;
							ride.save();
							return {
								ok: true,
								error: null,
							};
						} else {
							return {
								ok: false,
								error: "승차를 업데이트 할 수 없습니다.",
							};
						}
					} catch (error) {
						return {
							ok: false,
							error: error.message,
						};
					}
				} else {
					return {
						ok: false,
						error: "당신은 운전자가 아닙니다.",
					};
				}
			},
		),
	},
};

export default resolvers;
