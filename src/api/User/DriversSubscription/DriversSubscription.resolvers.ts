const resolvers = {
	Subscription: {
		DriversSubscription: {
			subscribe: (_, __, { pubSub }) => {
				return pubSub.asyncIterator("driverUpdate"); // 비동기로 반복할 이벤트 설정
			},
		},
	},
};

export default resolvers;
