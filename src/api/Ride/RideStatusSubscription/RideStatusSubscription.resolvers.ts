import { withFilter } from "graphql-yoga";
import User from "../../../entities/User";

const resolvers = {
	Subscription: {
		RideStatusSubscription: {
			subscribe: withFilter(
				(_, __, { pubSub }) => pubSub.asyncIterator("rideUpdate"),
				async (payload, _, { context }) => {
					const user: User = context.currentUser;
					// payload 는 driverId, passengerId 를 담고 있다.
					const {
						RideStatusSubscription: { driverId, passengerId },
					} = payload;
					return user.id === driverId || user.id === passengerId;
				},
			),
		},
	},
};

export default resolvers;
