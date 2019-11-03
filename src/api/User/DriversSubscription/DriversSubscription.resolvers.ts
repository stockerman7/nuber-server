// 여기서는 운전자를 구독한 측, 바로 탑승자 측에서 해야할 이벤트, 즉 운전자와 근접한지 여부를 전달한다.
import { withFilter } from "graphql-yoga";
import User from "../../../entities/User";

const resolvers = {
	Subscription: {
		DriversSubscription: {
			subscribe: withFilter(
				// ReportMovement(게시한 쪽)에서 구독한 채널을 받아 업데이트 실행되는 구간
        // pubSub 인자는 구독을 위해 가져왔고, payload 는 운전자 위치, context 는 탑승자 위치를 알기 위해 가져옴(단, 현재 운전자와 탑승자 정보가 동일함)
				(_, __, { pubSub }) => pubSub.asyncIterator("driverUpdate"),
				(payload, _, { context }) => {
					const user: User = context.currentUser;
					const {
						DriversSubscription: {
							lastLat: driverLastLat,
							lastLng: dirverLastLng,
						},
					} = payload;
					const { lastLat: userLastLat, lastLng: userLastLng } = user;
					// 운전자, 탑승자의 근접 위치를 비교해, 위도 좌우로 0.05 씩, 경도 상하로 0.05 씩 직사각형 범위
					// true, false 냐에 따라 Subscription 을 전달하거나 안할 수 있다.
					return (
						driverLastLat >= userLastLat - 0.05 &&
						driverLastLat <= userLastLat + 0.05 &&
						dirverLastLng >= userLastLng - 0.05 &&
						dirverLastLng <= userLastLng + 0.05
					);
				},
			),
		},
	},
};

export default resolvers;
