# Nuber Server

노마드 아카데미 (N)Uber 클론 코딩 서버 파트. GraphQL, Typescript, NodeJS


## #1.8 gql-merge && graphql-to-typescript 설정
Typescript 에서는 Value, Arguments 들의 타입이 무엇인지 체크할 수 있다. 그러나 GraphQL 에서는 타입 체크라는 기능이 없다. 타입 체크가 가지는 강점을 이용하기 위해선 GraphQL 에서 정의되고 반환되는 객체나 타입이 무엇인지 Typescript가 인식하도록 해야한다. 결국 GraphQL 에서도 타입 체크를 위한 설정을 해야한다.

다음 필요한 두 가지 모듈을 설치한다.

```bash
$ yarn add graphql-to-typescript gql-merge --dev
```

- gql-merge : 모든 `.graphql` 파일들을 하나로 합쳐준다.
- graphql-to-typescript : 합쳐진 `.graphql` 파일들을 Typescript 가 인식되도록 `.ts` 파일을 만들어 준다.

우선 설치한 것들을 코드에서 직접 작성해 실행되도록 적용하진 않을 것이다. `package.json` 에서 `scripts` 설정을 통해 실행되도록 적용할 것이다.

### package.json 설정

```json
...
"scripts": {
  "predev": "yarn run types",
  "dev": "cd src && nodemon --exec ts-node index.ts -e ts,graphql",
  "pretypes": "gql-merge --out-file ./src/schema.graphql ./src/api/**/*.graphql",
  "types": "graphql-to-typescript ./src/schema.graphql ./src/types/graph.d.ts"
},
...
```
- `dev` : `nodemon --exec ts-node index.ts` 는 Hot Loading 이다. (우선 전제 nodemon, ts-node 설치) `ts-node` 는 `index.ts` 를 실행(`.ts` 를 `.js` 로 변환)한다. 그리고 `nodemon` 이 다른 확장자 `ts, graphql` 을 감시하도록 `-e` 옵션을 준다.
- `pretypes` : Typescript 하기전 선처리를 말한다. 먼저 모든 `.graphql` 파일들을 합친다. 첫번째 매개변수는 output 으로 생성할 파일 경로이고 두번째는 소스 파일 경로다.
- `types` : `pretypes` 에서 생성된 `schema.graphql` 파일로 Typescript 로 변환한다. 두번째 매개변수가 output 파일 경로다. `.d.ts` 파일은 Typescript가 타입이 정의된 파일이라고 인식하게 해준다. 그리고 VSC(Visual Studio Code)에서 자동으로 `import` 하도록 도와준다. (`tsconfig.json` 에서 `"rootDir"` 설정이 `"src"` 경로로 설정된 경우 그 파일안에 모든 `.d.ts` 를 찾을 것이다. )

작동 순서는 `predev`, `pretypes`, `types`, `dev` 이다.

> NOTE: Hot Loading 은 애플리케이션을 재시작하거나 재설정하지 않아도 실행중인 상태에서 업데이트를 하게 해주는 것을 말한다.

----

## #1.10 TypeORM 설정하기
이제 ORM 을 이용해 데이터베이스와 연결한다. 그중에서도 TypeORM 을 사용할 것이다. TypeORM 은 TypeScript 및 JavaScript (ES5, ES6, ES7, ES8)와 함께 사용할 수 있는 ORM 이다.
https://github.com/typeorm/typeorm

> NOTE: ORM 프레임워크(Object-Relational Mapping)는 데이터베이스와 객체 지향 프로그래밍 언어간의 호환되지 않는 데이터를 변환하는 프로그래밍 기법이다.

다음 모듈을 설치한다.
```bash
$ yarn add typeorm
```

먼저 TypeORM 설정 파일인 `src/ormConfig.ts` 를 만든다.

```typescript
import { ConnectionOptions } from "typeorm";

const connectionOptions: ConnectionOptions = {
	type: "postgres", // 어떤 데이터베이스 환경인지
	database: "nuber", // 데이터베이스 이름
	synchronize: true,
	logging: true,
	entities: ["entities/*.*"], // 핵심 모델이 있는 경로
	host: process.env.DB_ENDPOINT, // 서버 host 주소
	port: 5432, // postgres 기본 포트
	username: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
};

export default connectionOptions;
```

연결 옵션을 설정하고 특히 `entities` 는 데이터베이스와 연결하기 위헤 모든 모델 파일이 있는 Typescript Schema 들을 가져온다. `*.*` 는 확장자가 `.ts`, `.js` 가 될 수도 있다는 뜻이다.

> NOTE: Entity 는 컴퓨터 세계에서 정보/의미의 최소 단위를 말한다.

그리고 TypeORM 이 적용된 데이터베이스 접속을 우선적으로 하고 앱을 실행해야 한다. `index.ts` 안에 다음과 같이 추가/변경 한다.

```typescript
import { Options } from "graphql-yoga";
import { createConnection } from "typeorm"; // 1. DB서버 연동을 위한 orm 생성
import app from "./app";
import connectionOptions from "./ormConfig"; // 2. DB서버 orm 옵션들

const PORT: number | string = process.env.PORT || 4000;
const PLAYGORUND_ENDPOINT: string = "/playground";
const GRAPHQL_ENDPOINT: string = "/graphql";

const appOptions: Options = {
	port: PORT,
	playground: PLAYGORUND_ENDPOINT,
	endpoint: GRAPHQL_ENDPOINT,
};

const handleAppStart = () => console.log(`Listening on port ${PORT}`);

// 3. DB서버 접속 후 앱 연동 설정, catch 로 에러를 잡는다.
createConnection(connectionOptions)
	.then(() => {
		app.start(appOptions, handleAppStart);
	})
	.catch(error => console.log(error));
```

이처럼 TypeORM Entity 은 자동으로 데이터베이스와 연동이 되도록 도와준다. 그러나 GraphQL 에서 바로 자동으로 TypeORM Entity 으로 변경해주는 기능은 아직 존재하지 않는다. 그래서 다음 작업에서는 TypeORM Entity 를 직접 작성해야 한다.

정리하자면 GraphQL Schema 를 Typescript Schema 로 바꿔주고, 바뀐 Typescript Schema 와 TypeORM Entity 의 연결을 통해 데이터베이스에도 적용이 되도록 한다.

----

## #1.11 환경 변수 설정

이제 `host`, `username`, `password` 를 이용해 데이터베이스로 접속해야 한다. 접속은 보안이 중요하기 때문에 따로 `.env` 형식의 파일을 만들어 접속을 관리하는 것이 안전하다. 우선 다음 모듈을 설치한다.

```bash
$ yarn add dotenv
```

`dotenv` 모듈은 환경 변수를 설정하기에 적합하다. 그리고 `src/.env` 파일을 만든다. 그 안에 내용은 다음과 같이 적용한다.

```
DB_ENDPOINT=localhost
DB_USERNAME=mins
DB_PASSWORD=
```

`DB_PASSWORD` 는 아직 필요 없기 때문에 적용하지 않았다. 다음은 `index.ts` 파일 상단에 `dotenv` 모듈을 불러오자.

```typescript
import dotenv from "dotenv";
dotenv.config();
...
```

`dotenv.cofing()` 호출로 `.env` 을 찾아 적용한다. 꼭 `connectionOption` 이전에 불러오고 호출해야만 한다. 그렇게 하는 이유는 환경변수가 적용되지 않은 상태에서 ORM 이 실행되면 안되기 때문이다. 다시말해 환경변수`.env` 설정이 되어야 `ormConfig.ts` 파일의 `connectionOption` 옵션들이 제대로 적용된다.

그리고 Git 에 Push 하기 전에 `.gitignore` 파일에 `.env` 을 추가한다. 환경변수는 노출되면 보안에 치명적이기 때문이다.

----

## #1.13 Class Validator 설치
Validate 는 무엇인가를 검증한다는 뜻이다. 그렇다면 무엇을 검증할까? Typescript 처럼 타입을 검사하지는 않는다. Validate 는 변수의 범위(Min, Max), 텍스트의 길이(Length)제한 등과 같이 특정 조건에 만족하는지를 검사한다.

다음 모듈을 설치한다. https://github.com/typestack/class-validator

```bash
$ yarn add class-validator
```

TypeORM Entity 는 기본적으로 클래스를 만들어 Entity 정보를 구성한다. Primary(기본키)를 만들고 필요한 속성에 따라 Column 을 만든다. 그러다 보면 Column(속성)마다 특정 범위나 길이를 검사해야만 할 경우가 생긴다. 예를들어 이메일과 같이 `@` 가 들어가야 한다거나 연락처가 7자리에서 11자리 숫자여야만 하는 검사를 들 수 있다.

`src/entities/User.ts` 의 Entity 구성

```typescript
import { IsEmail } from "class-validator"; // 1. 이메일 검증을 위한 모듈
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

@Entity()
class User extends BaseEntity {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: "text", unique: true })
  @IsEmail() // 2. 이메일 검증
  email: string;

  @Column({ type: "boolean", default: false })
  verifiedEmail: boolean;
  
  @Column({ type: "text" })
	firstName: string;

	@Column({ type: "text" })
	lastName: string;

	@Column({ type: "int" })
	age: number;

	@Column({ type: "text" })
	password: string;

	@Column({ type: "text" })
	phoneNumber: string;

	@Column({ type: "boolean", default: false })
	verifiedPhoneNumber: boolean;

	@Column({ type: "text" })
	profilePhoto: string;

  @CreateDateColumn() createdAt: string;
  @UpdateDateColumn() updatedAt: string;
}

export default User;
```

여기서는 많은 부분의 `@Column` 들을 생략했다. `src/api/User/shared/User.graphql` 에 키 리스트가 똑같이 여기에도 적용되야 한다는 것을 염두한다.

`User.graphql` 구성

```gql
type User {
	id: Int!
	email: String
	verifiedEmail: String!
	firstName: String!
	lastName: String!
	age: Int
	password: String
	phoneNumber: String
	verifiedPhoneNumber: Boolean!
	profilePhoto: String
	fullName: String
	isDriving: Boolean!
	isRiding: Boolean!
	isTaken: Boolean!
	lastLng: Float
	lastLat: Float
	lastOrientation: Float
	createdAt: String!
	updatedAt: String
}

type Query {
  user: User
}
```

## #1.14 User Entity 추가
이제 `User.ts` 에 `profilePhoto` 이어서 `@Column` 들을 추가한다.

```typescript
@Entity()
class User extends BaseEntity {
...
  get fullName(): string {
  return `${this.firstName} ${this.lastName}`;
  }

  @Column({ type: "boolean", default: false })
  isDriving: boolean;

  @Column({ type: "boolean", default: false })
  isRiding: boolean;

  @Column({ type: "boolean", default: false })
  isTaken: boolean;

  // double precision -> PostgresQL 에서 지원하는 float 대체 타입
  @Column({ type: "double precision", default: 0 })
  lastLng: number;

  @Column({ type: "double precision", default: 0 })
  lastLat: number;

  @Column({ type: "double precision", default: 0 })
  lastOrientation: number;
...
}
```

`lastLng`, `lastLat`, `lastOrientation` 은 타입을 `double precision` 으로 설정한 것을 볼 수 있다. PostgresQL 에서는 `Float` 타입을 지원하지 않지만 이것으로 대체한다.

여기서 `get fullName()` 는 getter 메소드이다. 이 메소드는 `string` 타입을 반환하는데 그것은 `firstName`, `lastName` 을 합친 결과다.

----

## #1.15 User Password 암호화
사용자의 비밀번호는 절대 노출이 되서는 안된다. 통신을 할때도 마찬가지다. 더 추가적인 작업이 필요한데 바로 암호화(Encryption) 작업이다.

사용자가 가입시 '1234' 라는 비밀번호를 서버에게 알려주면 서버는 원본을 우선 암호화하고 데이터베이스에 저장한다. 나중에 사용자가 다시 로그인 할 때 비밀번호를 서버에게 전달하면 서버는 로그인으로 전달된 비밀번호를 암호화 하고 데이터베이스에 있던 암호화된 비밀번호와 비교하는 방식이다.

암호화 모듈을 설치하자.
```bash
$ yarn add bcrypt
$ yarn add @types/bcrypt --dev
```

`@types/bcrypt` 는 `bcrypt` 의 타입체크다. `src/entities/User.ts` 에는 `bcrypt` 모듈 불러온다.

```typescript
import bcrypt from "bcrypt"; // password 암호화(encryption)에 사용
import { IsEmail } from "class-validator";
import {
  BaseEntity,
	BeforeInsert,
	BeforeUpdate,
	Column,
	CreateDateColumn,
	Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

const BCRYPT_ROUND = 10; // 몇번 암호화 할 것인지
  ...
  ...

  @BeforeInsert()
	@BeforeUpdate()
	async savePassword(): Promise<void> {
		if (this.password) {
			// awiat: 처리가 완료 될 때까지 기다렸다가 반환(비동기 Promise의 동기 작업이 필요할 시)
			const hasedPassword = await this.hashPassword(this.password);
			this.password = hasedPassword; // 암호화된 password 저장
		}
	}
	// 사용자가 보낸 password 와 이전에 hash(암호화)한 password 를 비교
	public comparePassword(password: string): Promise<boolean> {
		return bcrypt.compare(password, this.password);
	}
	// password를 암호화하는 private(접근제한) 함수, string 타입인 hash 값을 반환하는 Promise
	private hashPassword(password: string): Promise<string> {
		return bcrypt.hash(password, BCRYPT_ROUND);
  }
...
```

- `@BeforeInsert`, `@BeforeUpdate` 를 추가한 이유는 객체를 업데이트 하기전에 이루어지는 메소드가 필요하기 때문이다. 만약 무엇인가를 저장하거나 업데이트를 하기에 앞서 비밀번호(Password)를 암호화(Encryption) 해야한다.
- `savePassword` : 함수 앞에 `async` 는 함수를 비동기 `Promise` 객체를 반환하게 만들어 준다. `<void>` 는 `return` 값을 말한다. 즉 반환 값이 없는 `Promise` 타입이다. `await` 은 암호화된 결과 값을 반환 받을 또 다른 외부의 `Promise` 를 기다린다. `await` 은 `async` 함수 안에서만 가능하다.
- `comparePassword` : 이전에 저장한 암호화된 비밀번호와 비교해 맞는지 여부를 확인한다.
- `hashPassword` : `string` 타입의 비밀번호를 받는다. 이것을 암호화하고 결과를 반환한다. 반환 값도 `string` 타입이다. `bcrypt.hash` 함수 호출시 두번째 매개변수는 몇번 암호화 할 것인지 설정한다.

> NOTE:
> 
> `async savePassword(): Promise<void> {...}` 는 다음 코드와 똑같이 동작한다.
> 
> ```js
> function savePassword() {
>   return Promise(resolve, reject) => {
>     ...
>     resolve(hasdPassword); // 암호화된 비밀번호 전달
>   }
> }
> ```

----

## #1.17 Verification Entity
여기서는 사용자 인증을 위한 확인(Verification) Entity 를 만든다. Verification 은 '확인'과정, 보통 Validation(검증)과 혼동되기도 하지만 'Verification(확인)'은 내부적으로 확인 'Validation(검증)'은 외부에서 확인받는 것이라고 보면 된다. 자주 사용되는 사용자 확인으로 Phone, Email 을 다룰 것이다.

`src/api/Verification/shared/Verification.graphql` 을 만들고 적용한다.

```gql
type Verification {
	id: Int!
	user: User!
	target: String!
	payload: String!
	key: String!
	used: Boolean!
	createAt: String!
	updateAt: String!
}
```

> NOTE: Payload 는 데이터 전달시 헤더와 메타데이터와 같은 데이터는 제외하고 근본적인 목적이 되는 데이터 만을 말한다.

`src/entities/Verification.ts` 를 만들고 다음과 같이 적용한다.

```typescript
import { verificationTarget } from "src/types/types";
import {
	BaseEntity,
	BeforeInsert,
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import User from "./User";

const PHONE = "PHONE";
const EMAIL = "EMAIL";

@Entity()
class Verification extends BaseEntity {
	@PrimaryGeneratedColumn() id: number;

	@Column({ type: "text", enum: [PHONE, EMAIL] })
	target: verificationTarget;

	@Column({ type: "text" })
	payload: string;

	@Column({ type: "text" })
	key: string;

	@Column({ type: "boolean", default: false })
	used: boolean;

	@CreateDateColumn() createdAt: string;

	@UpdateDateColumn() updatedAt: string;

	@BeforeInsert() // 테스트로 전화번호, 이메일을 생성.
	createKey(): void {
		if (this.target === PHONE) {
			this.key = Math.floor(Math.random() * 100000).toString();
		} else if (this.target === EMAIL) {
			this.key = Math.random()
				.toString(36) // '36' 은 숫자를 문자로 바꿔준다.
				.substr(2);
		}
	}
}

export default Verification;
```

- `verificationTarget` 을 불러오고 `@Column({ type: "text", enum: [PHONE, EMAIL] }) target: verificationTarget;` 은 설정하면 둘중 무엇이든 확인 요청이 가능하도록 한다. 나중에 확인 절차에 사용된다.
- `createKey` 는 테스트 함수다. `@BeforeInsert` 를 이용해 새 Verification 가 생성될 때 먼저 전화번호일 경우 이메일일 경우를 구분해 키를 생성한다.

`src/types/types.d.ts` 파일에 사용자 확인을 위한 `target` 으로 `PHONE`, `EMAIL` 둘다 타입체크 한다. 현재는 둘중 하나만 가능하며 나머지 다른 것들로 확인 절차를 받을 수 없다.

```typescript
export type verificationTarget = "PHONE" | "EMAIL";
```

----

## #1.22 Chat & Message Entity

여기서 핵심적으로 다룰 내용은 `Chat`, `Message`, `User` 간의 관계 설정이다. 관계 설정이랑 서로 유기적으로 어떻게 연관성을 가지며 상대의 정보를 알고 있느냐를 말한다. 그 관계는 일대다 `@OneToMany`, 다대일 `@ManyToOne`, 다대다 `@ManyToMany` 관계로 설정할 것이다.

먼저 Chat, Message Entity 를 동시에 만들어 보도록 하자.

api 디렉토리 안에는 <br>
`src/api/Chat/shared/Chat.graphql` <br>
`src/api/Chat/shared/Message.graphql`

#### Chat.graphql
```graphql
type Chat {
	id: Int!
	messages: [Message]
	participants: [User]
	createdAt: String!
	updatedAt: String
}
```
Chat 에서 관계 설정에 눈여겨 봐야할 부분은 `messages: [Message]`, `participants: [User]` 이다.

#### Message.graphql
```graphql
type Message {
	id: Int!
	text: String!
	chat: Chat!
	user: User!
	createdAt: String!
	updatedAt: String
}
```
Message 에서 관계 설정에 눈여겨 봐야할 부분은 `chat: Chat!`, `user: User!` 이다.

entities 디렉토리 안에는 <br>
`src/entities/Chat.ts` <br>
`src/entities/Message.ts`

#### Chat.ts
```typescript
import {
	BaseEntity,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import Message from "./Message";
import User from "./User";

@Entity()
class Chat extends BaseEntity {
	@PrimaryGeneratedColumn() id: number;

  // param1: 대상(target) 타입, param2: 메세지 객체
	// Chat은 다수의 메세지를 가진다. 관계가 있는 쪽에선 chat.messages 를 이용한다.
	@OneToMany(type => Message, message => message.chat)
	messages: Message[];
	// Chat은 다수의 User를 가진다. 관계가 있는 쪽에선 chat.participants 를 이용한다
	@OneToMany(type => User, user => user.chat)
	participants: User[];

	@CreateDateColumn() createdAt: string;

	@UpdateDateColumn() updatedAt: string;
}

export default Chat;
```
Chat Entity 의 관계 설정을 보도록 하자. 우선 첫번째 `@OneToMany` 를 보면 `Chat` 은 다수의 `Message` 를 가질 수 있고 그 메세지는 `message.chat` 으로 메세지가 현재 어느 채팅방에 있는지 알고 있다. 관계가 있는 다른쪽에선 `chat.messages` 를 이용해 채팅방에 어떤 메세지들이 존재하는지 알 수 있도록 설정한다.

두번째 `@OneToMany` 를 보면 다수의 `User`(참여자)를 가지고 있으며 `user.chat` 을 통해 참여자가 어느 채팅방에 있는지 알 수 있다. 관계가 있는 다른쪽에선 `chat.participants` 를 통해 채팅 참여자들이 누군지 알 수 있도록 설정한다.

잘보면 다수가 되는 쪽에는 배열 타입인 `Message[]`, `User[]` 로 되어있다.


#### Message.ts
```typescript
import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import Chat from "./Chat";
import User from "./User";

@Entity()
class Message extends BaseEntity {
	@PrimaryGeneratedColumn() id: number;

	@Column({ type: "text" })
	text: string;

	// Message 는 하나의 Chat 가진다. 관계가 있는 쪽에선 message.chat 을 이용한다
	@ManyToOne(type => Chat, chat => chat.messages)
	chat: Chat;

	// Message 는 하나의 User 가진다. 관계가 있는 쪽에선 message.user 를 이용한다
	@ManyToOne(type => User, user => user.messages)
	user: User;

	@CreateDateColumn() createdAt: string;

	@UpdateDateColumn() updatedAt: string;
}

export default Message;
```

Message Entity 의 관계 설정을 보도록 하자. 첫번째 `@ManyToOne` 를 보면 다수의 `Message` 는 `chat.messages` 를 통해 채팅방에 또 다른 메세지들을 알고 있다. 관계가 있는 다른쪽에선 `message.chat` 을 통해 메세지가 현재 어떤 채팅방에 있는 알 수 있도록 설정한다.

두번째 `@ManyToOne` 를 보면 다수의 `Message` 는 `user.messages` 를 통해 사용자가 어떤 메세지들을 보고 있는지 알 수 있다. 관계가 있는 다른쪽에선 `message.user` 를 통해 메세지를 보낸 사용자가 누군지 알 수 있도록 설정한다.

만약 여러개의 Chat 에서 다수의 메세지, 다수의 사용자를 가지려면 어떻게 하면 될까? `User.ts` 에 `OneToMany` 를 `ManyToMany` 로 변경하면 된다.

```typescript
@ManyToMany(type => Chat, chat => chat.participants)
chat: Chat[];
```
이렇게 하면 `Chat` 에는 다수의 메세지, 다수의 사용자를 알고 있으니 관계가 저절로 성립된다.


----
## #1.25 까지 파일 구성 요약

```
src
 ┣ api
 ┃ ┣ Chat
 ┃ ┃ ┗ shared
 ┃ ┃   ┣ Chat.graphql
 ┃ ┃   ┗ Message.graphql
 ┃ ┣ Place
 ┃ ┃ ┗ shared
 ┃ ┃   ┗ Place.graphql
 ┃ ┣ Ride
 ┃ ┃ ┗ shared
 ┃ ┃   ┗ Ride.graphql
 ┃ ┣ User
 ┃ ┃ ┗ shared
 ┃ ┃   ┗ User.graphql
 ┃ ┗ Verification
 ┃   ┗ shared
 ┃     ┗ Verification.graphql
 ┣ entities
 ┃ ┣ Chat.ts
 ┃ ┣ Message.ts
 ┃ ┣ Place.ts
 ┃ ┣ Ride.ts
 ┃ ┣ User.ts
 ┃ ┗ Verification.ts
 ┣ types
 ┃ ┣ graph.d.ts
 ┃ ┣ resolvers.d.ts
 ┃ ┗ types.d.ts
 ┣ .env
 ┣ app.ts
 ┣ index.ts
 ┣ ormConfig.ts
 ┣ schema.graphql
 ┗ schema.ts
```

- api: 각 기능별 GraphQL Schema 로 정의된 `.graphql` 과 `resolvers.ts` 파일들, `schema.ts` 에서 모든 파일들이 합쳐지고 `app.ts` 에서 설정된다.
- entities: 데이터베이스와 연동시킬 Typescript 로 이루어진 TypeORM Entity 파일들, `ormConfig.ts` 에서 옵션들을 구성하고 `index.ts` 에서 적용된다. 그전에 `typeorm` 이 설치되어야 한다.
- types: api 디렉토리에 있는 GraphQL Schema 타입 체크를 위해 Typescript 로 변환된 `.d.ts` 파일들, 이전 과정을 보면 api 의 모든 `.graphql` 파일들이 `schema.graphql` 로 합쳐져지고 다시 `types/graph.d.ts` 로 변환된다.

## Resolver

### Public Resolver
- [ ] 로그인 / Facebook(SNS) 가입
- [ ] 이메일 가입
- [ ] 이메일 로그인
- [ ] 핸드폰 번호 인증 시작
- [ ] 핸드폰 번호 인증 완료
----------

### Private Resolver (JWT)
- [ ] 이메일 인증
- [ ] 프로파일 조회
- [ ] 프로파일 변경
- [ ] 운전 모드 변환
- [ ] 지역 / 위치 분석
- [ ] 장소 추가
- [ ] 장소 수정
- [ ] 장소 삭제
- [ ] 주변 운전자 찾기
- [ ] 주변 운전자 예약
- [ ] 탑승 요청
- [ ] 주변 탑승자 조회
- [ ] 주변 탑승자 예약
- [ ] 주변 탑승자 찾기 요청
- [ ] 예약된 주변 탑승자 요청
- [ ] 예약된 탑승 상태
- [ ] 채팅방 메세지 얻기
- [ ] 채팅방 메세지 승인
- [ ] 채팅 메세지 전달

> NOTE:
> 
> **JSON Web Token (JWT)**
> 
> 웹표준 (RFC7519) 으로서 두 개체에서 JSON 객체를 사용하여 가볍고 자가수용적인 (self-contained) 방식으로 정보를 안전성 있게 전달해준다. JWT는 서버와 클라이언트 간 정보를 주고 받을 때 HTTP Request Header에 JSON 토큰을 넣은 후 서버는 별도의 인증 과정없이 헤더에 포함되어 있는 JWT 정보를 통해 인증한다. 이때 사용되는 JSON 데이터는 URL-Safe 하도록 URL에 포함할 수 있는 문자만으로 만들게 된다. JWT는 HMAC 알고리즘을 사용하여 비밀키 또는 RSA를 이용한 'Public Key/Private Key' 쌍으로 서명할 수 있다.

## Code Challenge
- [ ] 탑승 기록 조회
- [ ] 탑승 상세 보기