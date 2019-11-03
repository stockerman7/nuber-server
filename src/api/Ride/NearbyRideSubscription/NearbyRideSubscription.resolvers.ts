import { withFilter } from "graphql-yoga";
import User from "../../../entities/User";

// Subscription Resolver 에서 왜 'Resolvers' type 설정이 없는지?
const resolvers = {
	Subscription: {
		NearbyRideSubscription: {
			subscribe: withFilter(
				(_, __, { pubSub }) => pubSub.asyncIterator("rideRequest"),
				async (payload, _, { context }) => {
          // 이 User 경우엔 Driver 이다.
					const user: User = context.currentUser;
					const {
						NearbyRideSubscription: { pickUpLat, pickUpLng },
					} = payload;
          const { lastLat: userLastLat, lastLng: userLastLng } = user;
          // 요청하는 사람의 픽업 위치가 Driver 근처라면 true 아니면 false 를 반환
					return (
						pickUpLat >= userLastLat - 0.05 &&
						pickUpLat <= userLastLat + 0.05 &&
						pickUpLng >= userLastLng - 0.05 &&
						pickUpLng <= userLastLng + 0.05
					);
				},
			),
		},
	},
};

export default resolvers;
