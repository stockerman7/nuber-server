export type Resolver = (parent: any, args: any, context: any, info: any) => any;

// typescript 에서 interface 는 타입체크를 위해 사용한다.
// 이것은 프로퍼티, 메소드 구현을 강제해 일관성을 유지할 수 있게 해준다.
export interface Resolvers {
	[key: string]: {
		[key: string]: Resolver;
	};
}
