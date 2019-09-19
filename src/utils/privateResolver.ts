// privateResolver 를 호출하는 쪽에선 resolver 함수를 필요시에 호출이 가능하도록 설정만 할 것이다.
const privateResolver = resolverFunction => async (_, __, context) => {
	// context 요청에 user 가 없다면 에러
	if (!context.req.user) {
		throw new Error("JWT 가 없습니다. 처리 과정에서 거부되었습니다.");
	}
	const resolved = await resolverFunction;
	return resolved;
};

export default privateResolver;
