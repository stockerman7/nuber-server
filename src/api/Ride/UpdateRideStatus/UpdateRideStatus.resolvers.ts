import Chat from "../../../entities/Chat";
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
				{ req, pubSub },
			): Promise<UpdateRideStatusResponse> => {
				const user: User = req.user;
				// 사용자가 Driver 인 경우, 운전자(Driver)가 탑승한(Ride) 경우와 승객(Passenger)이 탑승한 경우를 따져야 함
				if (user.isDriving) {
					try {
						let ride: Ride | undefined;
						// Driver 가 탑승을 승인(ACCEPTED)할 경우
						if (args.status === "ACCEPTED") {
							ride = await Ride.findOne(
								{
									id: args.rideId,
									status: "REQUESTING", // 중복 수락이 되지 않도록 요청중인 상태로 변경해야 한다.
								},
								{ relations: ["passenger"] }, // 승객과의 채팅을 위해 passenger 관계 설정을 해준다.
							);
							if (ride) {
								// 탑승 사용자는 운전자로서 결정되고 저장된다.
								ride.driver = user;
								user.isTaken = true;
								user.save();
								// 운전자가 탑승을 수락했기 때문에 새로운 채팅방이 생성된다.
								await Chat.create({
									driver: user,
									passenger: ride.passenger,
								}).save();
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
							pubSub.publish("rideUpdate", { RideStatusSubscription: ride });
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
