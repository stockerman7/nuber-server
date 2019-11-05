# Nuber Server

노마드 아카데미 (N)Uber 클론 코딩 서버 파트. GraphQL, Typescript, NodeJS


## #1.8 gql-merge & graphql-to-typescript 설정
Typescript 에서는 Value, Arguments 들의 타입이 무엇인지 체크할 수 있다. 그러나 GraphQL 에서는 타입 체크라는 기능이 없다. 타입 체크가 가지는 강점을 이용하기 위해선 GraphQL 에서 정의되고 반환되는 객체나 타입이 무엇인지 Typescript가 인식하도록 해야한다. 결국 GraphQL 에서도 타입 체크를 위한 설정을 해야한다.

다음 필요한 두 가지 모듈을 설치한다.

```bash
$ yarn add graphql-to-typescript gql-merge --dev
```

- gql-merge : 모든 `.graphql` 파일들을 하나로 합쳐준다.
- graphql-to-typescript : 합쳐진 `.graphql` 파일들을 Typescript 가 인식되도록 `.ts` 파일을 만들어 준다.

우선 설치한 것들을 코드에서 직접 작성해 실행되도록 적용하진 않을 것이다. `package.json` 에서 `scripts` 설정을 통해 실행되도록 적용할 것이다.

#### package.json 설정

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
- `types` : `pretypes` 에서 생성된 `schema.graphql` 파일로 Typescript 로 변환한다. 두번째 매개변수가 output 파일 경로다. `.d.ts` 파일은 Typescript가 타입이 정의된 파일이라고 인식하게 해준다. 그리고 VSC(Visual Studio Code)에서 자동으로 `import` 하도록 도와준다. (`tsconfig.json` 에서 `"rootDir"` 설정이 `"src"` 경로로 설정된 경우 그 디렉토리 안에 모든 `.d.ts` 를 찾을 것이다.)

작동 순서는 `predev`, `pretypes`, `types`, `dev` 이다.

> **NOTE:** Hot Loading 은 애플리케이션을 재시작하거나 재설정하지 않아도 실행중인 상태에서 업데이트를 하게 해주는 것을 말한다.

----

## #1.10 TypeORM 설정
이제 ORM 을 이용해 데이터베이스와 연결한다. 그중에서도 TypeORM 을 사용할 것이다. TypeORM 은 TypeScript 및 JavaScript (ES5, ES6, ES7, ES8)와 함께 사용할 수 있는 ORM 이다.
https://github.com/typeorm/typeorm

> **NOTE:** ORM 프레임워크(Object-Relational Mapping)는 데이터베이스와 객체 지향 프로그래밍 언어간의 호환되지 않는 데이터를 변환하는 프로그래밍 기법이다.

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

> **NOTE:** Entity(개체) 는 컴퓨터 세계에서 정보/의미의 최소 단위를 말한다. 흔히 Object(객체)와 혼동하기 쉬운데 객체는 사물이 가지는 속성 단위를 말한다. 즉 정보 단위냐 속성 단위냐의 차이점이 있다.

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

`dotenv.cofing()` 호출로 `.env` 을 찾아 적용한다. 꼭 `connectionOption` 이전에 불러오고 호출해야만 한다. 그렇게 하는 이유는 환경변수가 적용되지 않은 상태에서 ORM 이 실행되면 안되기 때문이다. 다시말해 환경변수`.env` 설정이 되어야 `ormConfig.ts` 파일의 `connectionOption` 옵션들이 제대로 적용된다.

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

`src/api/User/shared/User.graphql` 에 리스트가 똑같이 `User.ts` 에도 적용되야 한다는 것을 염두한다.

`User.graphql` 구성

```graphql
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
----

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
사용자의 비밀번호는 절대 노출이 되서는 안된다. 통신을 할때도 마찬가지인데 이를 위해선 추가적인 작업이 필요하다. 바로 암호화(Encryption) 작업이다.

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

@Entity()
class User extends BaseEntity {
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
  // password 를 암호화하는 private(접근제한) 함수, string 타입인 hash 값을 반환하는 Promise
  private hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUND);
  }
}
```

- `@BeforeInsert`, `@BeforeUpdate` 를 추가한 이유는 객체를 업데이트 하기전에 이루어지는 메소드가 필요하기 때문이다. 만약 무엇인가를 저장하거나 업데이트를 하기에 앞서 비밀번호(Password)를 암호화(Encryption) 해야한다.
- `savePassword` : 함수 앞에 `async` 는 함수를 비동기 `Promise` 객체를 반환하게 만들어 준다. `<void>` 는 `return` 값을 말한다. 즉 반환 값이 없는 `Promise` 타입이다. `await` 은 암호화된 결과 값을 반환 받을 또 다른 외부의 `Promise` 를 기다린다. `await` 은 `async` 함수 안에서만 가능하다.
- `comparePassword` : 이전에 저장한 암호화된 비밀번호와 비교해 맞는지 여부를 확인한다.
- `hashPassword` : `string` 타입의 비밀번호를 받는다. 이것을 암호화하고 결과를 반환한다. 반환 값도 `string` 타입이다. `bcrypt.hash` 함수 호출시 두번째 매개변수는 몇번 암호화 할 것인지 설정한다.

> **NOTE:**
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
여기서는 사용자 인증을 위한 Verification(인증/확인) Entity 를 만든다. Verification 은 '확인'과정, 보통 Validation(검증)과 혼동되기도 하지만 'Verification(인증/확인)'은 내부적으로 확인 'Validation(검증)'은 외부에서 확인받는 것이라고 보면 된다. 자주 사용되는 사용자 확인으로 Phone, Email 을 다룰 것이다.

`src/api/Verification/shared/Verification.graphql` 을 만들고 적용한다.

```graphql
type Verification {
  id: Int!
  target: String!
  payload: String!
  key: String!
  createAt: String!
  updateAt: String
}
```

> **NOTE:** Payload 는 데이터 전달시 헤더와 메타데이터와 같은 데이터는 제외하고 근본적인 목적이 되는 데이터 만을 말한다.

`src/entities/Verification.ts` 를 만들고 다음과 같이 적용한다.

```typescript
import { verificationTarget } from "src/types/types";
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

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

  @CreateDateColumn() createdAt: string;

  @UpdateDateColumn() updatedAt: string;

  // 핸드폰, 이메일을 인증하기 위한 키를 생성하는 부분
  // 핸드폰은 5자리 숫자, 이메일은 무작위 문자와 숫자의 나열로 키를 생성한다.
  @BeforeInsert()
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
- `createKey` 는 확인/인증 키를 생성하는 함수다. `@BeforeInsert` 를 이용해 새 Verification 가 생성될 때 먼저 핸드폰일 경우 이메일일 경우를 구분해 키를 생성한다. 생성된 키는 Server 에서 User(Client) 에게 전달되고 User(Client) 가 키를 입력하면 사용자 인증이 된다.

`src/types/types.d.ts` 파일에 사용자 확인을 위한 `target` 으로 `PHONE`, `EMAIL` 둘다 타입체크 한다. 현재는 둘중 하나만 가능하며 그외 나머지는 확인 절차를 받을 수 없다.

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

## #1.25 까지 파일 구성

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

- api: 각 기능별 GraphQL Schema 로 정의된 `.graphql` 과 `resolvers.ts` 파일들, `schema.ts` 에서 모든 파일들이 합쳐지고 `app.ts` 에서 적용된다.
- entities: 데이터베이스와 연동시킬 Typescript 로 이루어진 TypeORM Entity 파일들, `ormConfig.ts` 에서 옵션들을 구성하고 `index.ts` 에서 적용된다. 그전에 `typeorm` 이 설치되어야 한다.
- types: api 디렉토리에 있는 GraphQL Schema 타입 체크를 위해 Typescript 로 변환된 `.d.ts` 파일들, 이전 과정을 보면 api 의 모든 `.graphql` 파일들이 `schema.graphql` 로 합쳐져지고 다시 `types/graph.d.ts` 로 변환된다.

----

## Resolver 작업 리스트

### Public Resolver
- [ ] 로그인 / Facebook(SNS) 가입
- [ ] 이메일 가입
- [ ] 이메일 로그인
- [ ] 핸드폰 번호 인증 시작
- [ ] 핸드폰 번호 인증 완료

### Authentication
- [ ] JWT 생성
- [ ] JWT 인증

### Private Resolver
- [ ] 프로파일 조회
- [ ] 이메일 인증 요청
- [ ] 이메일 인증 완료
- [ ] 프로파일 변경
- [ ] 운전 모드 전환
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
- [ ] 탑승 상태 갱신
- [ ] 탑승 조회
- [ ] 예약된 탑승 상태
- [ ] 채팅방 만들기
- [ ] 채팅방 메세지 얻기
- [ ] 채팅방 메세지 승인
- [ ] 채팅 메세지 전달

## Code Challenge
- [ ] 탑승 기록 조회
- [ ] 탑승 상세 보기

----

## #1.34 Twilio 가입

Twilio 는 휴대폰, 이메일 인증과 같은 절차를 도와주는 RESTful API 서비스이다. 먼저 Twilio 가입을 하고 전화번호를 구입한다.

> **NOTE:**
> 
> ### RESTful API?
> 
> Representational State Transfer 약자이다. 자원을 이름(자원의 표현)으로 구분해 해당 자원의 상태(정보)를 주고 받는 모든 것을 의미한다.
> 
> 여기서 **자원의 표현**이라는 말은 인터넷 프로토콜인 HTTP URI(Uniform Resource Identifier)를 말한다. 그렇다면 **상태를 전달**한다는 것은 무슨 말일까? 이것은 데이터가 요청되는 시점의 자원의 상태 전달을 말한다. HTTP Method(POST, GET, PUT, DELETE)를 통해 CRUD Operation 한다. 흔히 JSON, XML 을 통해 데이터를 주고 받는다. 웹의 장점을 최대한 활용하는 아키텍처 스타일이다.

![Twilio Buy](https://lh3.googleusercontent.com/mpHlAu7w2d_qtctdN2euJNLZsS9NrZhI8MTZ6LfD37HGdKQOzeYEVK_3OgQeswokZhbTzLte8sibHNbrq7rnxKTI4Mw4ubvv0e1KqL6mLKRtPlAAPxJgoOU0PjfJo-QQ-JXMmKaAog=w1080)

우측 검색창에 `Buy A Number` 를 검색한다.

![Twilio Phone Number Search](https://lh3.googleusercontent.com/OUeiirKFejhBel0WxrS5_oIp4yVETGYcas3JIbsfmezKM9JeHDhpXnXsAD_56v_GBNZStfI07uU5r3ydIGQj_Z1MGo0HdUr4gcKioBOCnyBLQJW0ndLnB--FAWXDDxM6fipBr3EqFw=w1080)

현재 한국전화는 이용에 어려움이 있다. 이용 제한 국가를 제외한 국가를 선택하고 '지역번호'를 아무거나 선택해 검색한다.

![Twilio Availiable Phone Number](https://lh3.googleusercontent.com/gnhPq5xHPi41cR6ZfWKNm1q_AB5lqwsdnjM2li3MQE1hJJrgJcMDFXtCNdr4yQ_Ul_GQv0kNz4Bm4rNM-K7twOWuOOBlZ7gPoqs2tBzUvAKXc7Jr6EIrXhzJ6trBEKQMpk98x93U5Q=w1080)

검색으로 나온 리스트는 현재 사용 가능한 번호다. 우측에 `Buy` 버튼을 눌러 구입한다. $1.00 밖에 하지 않기 때문에 무료다.

![Twilio SMS Geographic Permissions](https://lh3.googleusercontent.com/qADA1fgLTUii55DaHNcCm3Ak_R1pFStnNbRUcpufhReb2nTgCTw4hO4NbYYyTMTI7utHxZUgJgmHH39LNwYJEvlQNIlOUBrfAtckVM1Ea_uQuF8bHWKa8JOomZsTUiQPnIsD96feiw=w1080)

구입을 완료한 후, 이제 검색창에 SMS 로 검색해 `SMS Geographic Permissions` 를 선택한다.

![SMS Geographic Permissions Country](https://lh3.googleusercontent.com/29_Kik-FkG54Hylvy4oJW7Ttkot5OD1Z5wvoUbEpcNnKOamtxC7WSdRHMPrXjtINhAiJRCB_NRFefuO55Yvliylubknpn6t_DnmctR4BrWPx0_OPgAKn_Ot_i4DiSv5XeZf-vUpxpQ=w1080)

메세지를 보낼 대상 국가를 선택하는 화면이 나타난다. 한국으로 SMS 를 전달할 것이기 때문에 Korea 로 선택한다.

![SMS Geographic Premissions Country Selected](https://lh3.googleusercontent.com/5YLGjjRzlsryDn2-YG5C0CDkzfz3yuPw-pJOVlVPVyZLGTl0nqYzbigjR2cmxNmDKPj-dPe1jc-8q3ETNjd4Rnw1SmVA-xnxmLbuWllTMxiAAU9fi1iZzqF8MluMCFXfC9jWB81q7A=w1080)

<image src="https://drive.google.com/uc?id=16wSWKV-9RRG8b25uciTWD4yFhig07YuK" alt="Build with Programmable SMS" width="1080">

좌측 메뉴에 `Learn & Build` 를 선택한다. `From` 은 Twilio 에서 보내는 발신 전화이며 `To` 는 한국에서 수신자의 번호이다. 현재 수신자는 구입한 사람으로 되어있다. 나중에 `To` 는 Client 측에서 인증시 입력하면 Client 측으로 5자리 숫자로 구성된 인증 SMS가 전달될 것이다.

<image src="https://drive.google.com/uc?id=18bjQJDJX8iqgQSR_s_r4pRwrsgiOGEnk" alt="Twilio Dashboard" width="1080">

Dashboard 하단에 `ACCOUNT SID`, `AUTH TOKEN` 이 보인다. `AUTH TOKEN` 은 인증 정보가 오고갈 때 필요한 토큰을 말한다. 중요하기 때문에 외부로 노출되면 안된다. 다음 절에선 `ACCOUNT SID`, `AUTH TOKEN`, 발신 `PHONE NUMBER` 이렇게 3가지로 휴대폰 SMS 인증을 해보자.

----

## #1.35 휴대폰 SMS 인증(StartPhoneVerification) 시작

Twilio 에서 얻은 `SID`, `AUTH TOKEN`, 발신 `PHONE NUMBER` 를 가지고 `.env` 에 다음 변수에 각각 값으로 추가한다.

```bash
TWILIO_SID=Account SID
TWILIO_PHONE=+82로 시작하는 휴대폰번호
TWILIO_TOKEN=Twilio에서 발행된 내 Token
```

`src/api/User` 에 `StartPhoneVerification` 디렉토리를 추가하고 그 안에 `StartPhoneVerification.graphql`, `StartPhoneVerification.resolvers.ts` 파일을 생성한다.

#### StartPhoneVerification.graphql
```graphql
type StartPhoneVerificationResponse {
  ok: Boolean!
  error: String
}

type Mutation {
  StartPhoneVerification(phoneNumber: String!): StartPhoneVerificationResponse!
}
```

`StartPhoneVerification` 은 폰번호를 인자로 받고 결과는 `ok`, `error` 로 받는다.

이제 Twilio 모듈을 추가하자.

```bash
$ yarn add twilio
```

Twilio 타입체크를 위한 모듈 설치
```bash
$ yarn add @types/twilio --dev
```

이제 실제로 SMS 인증이 폰에 전달되도록 해보자.

#### StartPhoneVerification.resolvers.ts
```typescript
import Verification from "../../../entities/Verification";
import {
  StartPhoneVerificationMutationArgs,
  StartPhoneVerificationResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import { sendVerificatoinSMS } from "../../../utils/sendSMS";

const resolvers: Resolvers = {
  Mutation: {
    StartPhoneVerification: async (
      _,
      args: StartPhoneVerificationMutationArgs,
    ): Promise<StartPhoneVerificationResponse> => {
      const { phoneNumber } = args;
      try {
        const existingVerification = await Verification.findOne({
          payload: phoneNumber,
        });
        // 존재하는 인증이 있는지 여부, 이미 존재하는 인증은 제거
        if (existingVerification) {
          existingVerification.remove();
        }
        // SMS 인증번호를 받기 위해 client 폰 번호를 서버측에 보낸다.
        // 결과적으로 인증된 건이 있건 없건 새로 생성함, 그리고 저장함
        const newVerification = await Verification.create({
          payload: phoneNumber,
          target: "PHONE",
        }).save();
        // 인증을 하기 위해 Client 측으로 폰 번호, 인증키를 보낸다.
        await sendVerificatoinSMS(newVerification.payload, newVerification.key);
        return {
          ok: true,
          error: null,
        };
      } catch (error) {
        return {
          ok: false,
          error: error.message,
        };
      }
    },
  },
};

export default resolvers;
```

`StartPhoneVerification` 에서 필요한 `args` 인자로 `phoneNumber` 를 받는다. `phoneNumber` 를 가지고 사용자 여부를 찾고 있다면 기존 사용자 인증을 제거한다.

없다면 새로운 `PHONE` 인증을 새로 생성한다(`Verification.ts` 에서 `createKey()` 가 먼저 호출되면서 `target === PHONE` 을 판단해 5자리 숫자를 생성한다는 것을 알아두자). 그리고 생성된 정보를 DB 에 저장한다. 그 다음 `sendVerificationSMS` 함수로 `phoneNumber`, 인증할 숫자 5자리인 `key` 를 인자로 전달해 사용자에게 인증해달라고 SMS 로 보내게 된다.


`src/utils/sendSMS.ts` 에 `sendVerificationSMS` 함수를 구현한 코드를 보도록 하자.

#### sendSMS.ts

```typescript
// 여기서는 Twilio 서버 측에서 SMS 인증을 사용자에게 보낸다.
// 특히 SMS 인증 번호를 생성하는 함수, 보내는 함수를 따로 만드는 것이 좋다.
import Twilio from "twilio";

const twilioClient = Twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

// SMS 인증 번호를 생성하는 부분
export const sendSMS = (to: string, body: string) => {
  // client 에게 message 를 새로 create(생성) 해서 보낸다.
  return twilioClient.messages.create({
    body, // body 가 인증번호일 것이다.
    to,
    from: process.env.TWILIO_PHONE, // SMS를 보내는 서버측(Twilio) 폰 번호
  });
};

// SMS 인증 번호를 보내는 부분
export const sendVerificatoinSMS = (to: string, key: string) => {
  sendSMS(to, `다음과 같은 인증번호를 입력해주세요: ${key}`);
};
```

- 두개의 함수중 `sendSMS` 는 어떤 사용자에게 보낼지 `to` 인자와 인증번호가 포함된 본문인 `body` 를 받아 `twilioClient.message` 를 생성해 누가 보낸 것인지 `from` 을 포함시켜 보낸다.
- `sendVerificationSMS` 함수는 `to` 와 인증키를 인자로 갖는 `sendSMS` 를 감싸는 함수다.

----

## async/await 그리고 예외 처리(번외)

`async/await` 은 좀 더 간편하게 비동기 처리를 구현할 수 있도록 ES7에서 도입되었다. `new Promise()` 를 다른 함수로 감싸고 `return` 하지 않고 함수 앞에 `async` 를 넣는 것 만으로도 비동기 처리가 가능하다.

<image src="https://drive.google.com/uc?id=1rOKQYTgr_pU9xflOW4vzB9S9I_pPrUGf" alt="async/await_예외처리_00" width="960">

함수 하나는 `Promise` 를 반환하는 함수이고 다른 하나는 `async` 를 함수 앞에 붙여 구현한 것이다. 둘다 똑같이 `Promise` 객체를 반환한다. 특히 `async` 는 일반 함수처럼 `return` 하는 것만으로도 `Promise` 를 반환한다.

<image src="https://drive.google.com/uc?id=1o206xtT-GKmQ1rjb5MvGUpRM-MYbIYe7" alt="async/await_예외처리_01" width="960">

그렇다면 `error` 를 반환해야 할 경우는 어떨까? 일반적인 `Promise` 구문은 `reject` 함수를 이용해 에러를 전달한다. 그러나 `async` 는 `throw` (흔히 `throw new Error("...")` 로 만들어 전달한다) 를 반환한다. 자세히보면 둘 다 `Uncaught` 가 되었다. `Uncaught` 구문이 나타났다는 것은 콜스택(호출순서)에서 에러가 난 시점 이후로 코드는 동작하지 않는다는 것을 말한다. 그러나 때때로 에러가 나더라도 이후 시점의 코드가 계속 동작해야할 경우는 어떻게 처리 할까?

<image src="https://drive.google.com/uc?id=1ljN5cdGGCfmqAJIiMY-NAnbiGaNPqgkl" alt="async/await_예외처리_02" width="960">

`.catch()` 를 사용해 에러를 예외처리 하면 가능하다. 더 이상 `Uncaught` 가 나타나지 않으며 제대로 동작한다.

<image src="https://drive.google.com/uc?id=1oPc1fbqCB9QVuYTvlyeqYzs9KejENvdo" alt="async/await_예외처리_03" width="960">

`await` 은 `async`, `Promise` 안에서만 설정/동작이 가능하고 비동기 처리 안에서도 처리를 기다려야 할 경우 사용한다. `await` 없이 `wait(3)` 함수 호출은 비동기 처리이기 때문에 바로 다음 `console.log(new Date())` 로 넘어가 출력한다.

<image src="https://drive.google.com/uc?id=1bqCoiJKkXEaU41qJsfRPZRd_S1zytxiS" alt="async/await_예외처리_04" width="960">

그러나 `await` 을 적용한 시점에서 부터는 3초 기다리고 다음 `console.log(new Date())` 가 출력된다.

<image src="https://drive.google.com/uc?id=1i2qTwCTUUe7_eoHMqMXPhROaBCVJUBFT" alt="async/await_예외처리_05" width="960">

<image src="https://drive.google.com/uc?id=1VrGXdUylX8YmSLlVjWZDmdH21UMJr2-R" alt="async/await_예외처리_06" width="960">

이제 `async`, `await` 의 예외처리도 `try/catch` 나 `.catch()` 를 사용하지 않으면 `Uncaught` 경고가 나온다.

<image src="https://drive.google.com/uc?id=1oIC6JlJfpr-cJkv7kVtN6za60Ya4tmfW" alt="async/await_예외처리_07" width="960">

이를 위해 `async` 안에도 `try/catch` 구문이나 `await` 함수에 `.catch()` 를 적용해주면 간단히 해결된다.

<image src="https://drive.google.com/uc?id=1SR5oqi6skVNSjL35gxfBT1mvA9hky99m" alt="async/await_예외처리_08" width="960">

만약 `const result` 변수를 추가해 반환된 결과가 무엇인지 출력해보면 어떻게 될까?

<image src="https://drive.google.com/uc?id=1lYsQwKsPw3kkswwqwcy9lxJt1BSFGaOI" alt="async/await_예외처리_09" width="960">

바로 `undefined` 가 출력된다. 이것은 `wait(3)` 함수의 반환결과가 아니다. 뒤로 이어지는 `.catch()` 함수가 `reject` 가 던진 에러를 받고 에러를 출력할 뿐 `return` 한 결과가 없기 때문이다.

----

## #1.37 StartPhoneVerification Resolver: SMS 보내기

이제 실제로 SMS 인증 번호가 보내지는 결과를 보도록 하자. `StartPhoneVerification.resolvers.ts` 에서 인증을 보내는 결과를 볼 수 있도록 `console.log(newVerification)` 출력한다.

#### StartPhoneVerification.resolvers.ts
```typescript
import Verification from "../../../entities/Verification";
import {
  StartPhoneVerificationMutationArgs,
  StartPhoneVerificationResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import { sendVerificatoinSMS } from "../../../utils/sendSMS";

const resolvers: Resolvers = {
  Mutation: {
    StartPhoneVerification: async (
      _,
      args: StartPhoneVerificationMutationArgs,
    ): Promise<StartPhoneVerificationResponse> => {
      const { phoneNumber } = args;
      try {
        ...
        const newVerification = await Verification.create({
          payload: phoneNumber,
          target: "PHONE",
        }).save();

        console.log(newVerification); // 실제로 보내는 결과를 출력

        await sendVerificatoinSMS(newVerification.payload, newVerification.key);
        return {
          ok: true,
          error: null,
        };
      } catch (error) {
        ...
      }
    },
  },
};

export default resolvers;
```

이제 `http://localhost:4000/playground` 로 접속해서 실제 핸드폰 인증을 보내도록 한다 (주의: PostgresQL 에 접속 되있어야 한다).

<image src="https://drive.google.com/uc?id=1NP1t8iUmdeww2ZY1s3XOvER-b7DwIXkI" alt="Start_Phone_Verification_Result_00" width="960">

다음 처럼 `console.log(newVerification)` 의 결과가 출력된 것을 볼 수 있다.

<image src="https://drive.google.com/uc?id=1pFF6zPwkGff0kdrFgSboUa1Yj9x500ad" alt="Start_Phone_Verification_Result_01" width="720">

폰에도 SMS 메세지가 온 것을 볼 수 있다.

<image src="https://drive.google.com/uc?id=1MLEnnNoN7iCAkRk4IUtMOFHE6yOR-DsY" alt="Start_Phone_Verification_Result_02" width="320">

Twilio 에서도 SMS 메세지를 보낸 결과가 나타난다.

<image src="https://drive.google.com/uc?id=1hxoMMTV81mceGoX1SVzFDKrWEmEAIS6P" alt="Start_Phone_Verification_Result_03" width="960">

<image src="https://drive.google.com/uc?id=1bzysaeIRng59UMfooA59P29o41z7V9YR" alt="Start_Phone_Verification_Result_04" width="960">

----

## #1.38 CompletePhoneVerification

`src/api/User/CompletePhoneVerification/` 디렉토리에 `CompletePhoneVerification.graphql` 과 `CompletePhoneVerification.resolvers.ts` 파일을 생성한다.

#### CompletePhoneVerification.graphql
```graphql
type CompletePhoneVerificationResponse {
  ok: Boolean!
  error: String
  token: String
}

type Mutation {
  CompletePhoneVerification(
    phoneNumber: String!
    key: String!
  ): CompletePhoneVerificationResponse!
}
```

#### CompletePhoneVerification.resolvers.ts
```typescript
import User from "../../../entities/User";
import Verification from "../../../entities/Verification";
import {
  CompletePhoneVerificationMutationArgs,
  CompletePhoneVerificationResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import createJWT from "../../../utils/createJWT";

const resolvers: Resolvers = {
  Mutation: {
    CompletePhoneVerification: async (
      _,
      args: CompletePhoneVerificationMutationArgs,
      ): Promise<CompletePhoneVerificationResponse> => {
      const { phoneNumber, key } = args;
      // 인증 완료 여부 확인, 폰 번호, 키 입력 값
      try {
        const verification = await Verification.findOne({
          payload: phoneNumber,
          key,
        });
        if (!verification) {
          return {
            ok: false,
            error: "인증된 키가 확인되지 않습니다.",
            token: null,
          };
        } else {
          verification.verified = true; // Verification 에는 인증됐다고 남기고
          verification.save(); // DB 저장
        }
      } catch (error) {
        return {
          ok: false,
          error: error.message,
          token: null,
        };
      }

      try {
        const user = await User.findOne({ phoneNumber });
        if (user) {
          user.verifiedPhoneNumber = true; // User 에는 인증된 폰 번호라고 알려주고
          user.save(); // DB 저장
          return {
            ok: true,
            error: null,
            token: "",
          };
        } else {
          // token 을 사용하지 않을 경우
          return {
            ok: true,
            error: null,
            token: null,
          };
        }
      } catch (error) {
        return {
          ok: false,
          error: error.message,
          token: null,
        };
      }
    },
  },
};

export default resolvers;
```

`try/catch` 구문이 두개가 존재하는데 첫번째는 인증 여부를 Verification Entity 에서 확인한다. 두번째는 사용자에게도 인증 여부를 알리기 위해 User Entity 에도 폰번호 인증 여부를 저장한다.

`src/api/Verification/shared/Verification.graphql` 에서 `verified: Boolean!` 를 추가해야 한다. 앞서 인증 결과를 저장하기 위해 `verification.verified = true` 를 기억할 것이다. 이것이 여기에 해당한다.

```graphql
type Verification {
  id: Int!
  target: String!
  payload: String!
  key: String!
  verified: Boolean! # 추가된 부분
  createAt: String!
  updateAt: String
}
```

`src/entities/Verification.ts` 에도 추가된 사항을 적용한다.

```typescript
@Entity()
class Verification extends BaseEntity {
  ...

  @Column({ type: "text" })
  key: string;

  // 추가된 부분
  @Column({ type: "boolean", default: false })
  verified: boolean;

  @CreateDateColumn() createdAt: string;

  @UpdateDateColumn() updatedAt: string;

  ...
}
```

----

## #1.40 EmailSignUp Resolver

다음은 이메일 가입과 인증을 다뤄보자. 우선 디렉토리 `src/api/User/EmailSignUp` 를 만든다. `EmailSignUp.graphql`, `EmailSignUp.resolvers.ts` 파일들을 만든다.

#### EmailSignUp.graphql
```graphql
type EmailSignUpResponse {
  ok: Boolean!
  error: String
  token: String
}

type Mutation {
  EmailSignUp(
    firstName: String!
    lastName: String!
    email: String!
    password: String!
    profilePhoto: String!
    age: Int!
    phoneNumber: String!
  ): EmailSignUpResponse!
}
```

#### EmailSignUp.resolvers.ts
```typescript
import User from "../../../entities/User";
import {
  EmailSignUpMutationArgs,
  EmailSignUpResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import createJWT from "../../../utils/createJWT";

const resolvers: Resolvers = {
  Mutation: {
    EmailSignUp: async (
      _,
      args: EmailSignUpMutationArgs,
    ): Promise<EmailSignUpResponse> => {
      const { email } = args;
      // 기존에 있는 사용자는 가입이 아니라 로그인
      try {
        const existingUser = await User.findOne({ email });
        // console.log("Email 기존 가입자: ", existingUser);
        if (existingUser) {
          return {
            ok: false,
            error: "이미 가입된 사용자, 대신 로그인 합니다.",
            token: null,
          };
        } else {
          const newUser = await User.create({ ...args }).save();
          // console.log("Email 새로운 가입자: ", newUser);
          return {
            ok: true,
            error: null,
            token : "",
          };
        }
      } catch (error) {
        return {
          ok: false,
          error: error.message,
          token: null,
        };
      }
    },
  },
};

export default resolvers;
```

- 이메일 가입은 `email` 로 사용자 존재 여부를 찾는다.(Facebook 가입은 `fbID` 로 찾았다) 기존 사용자가 있다면 바로 로그인 하고 아니면 새 가입자를 만들기 위해 `User.create()` 한다.
- 새 가입자는 `{ ...args }` 인자를 적용해 추가한다. 이렇게 하는 이유는 User Scheme 중에 `EmailSignUpMutationArgs` 에 정의된 Entity (`firstName`, `lastName`, `email`, `password`, `profilePhoto`, `age`, `phoneNumber`) 모두를 추가/업데이트 하기 위해서다.

----

## #1.41 사용자 JWT 생성
이제 사용자를 인증하는 방식인 JWT(JSON Web Token)을 다룰 것이다. 우선 다음 모듈을 설치한다.

```bash
$ yarn add jsonwebtoken
```

타입체크를 위한 모듈 설치
```bash
$ yarn add @types/jsonwebtoken --dev
```

그리고 다음은 `src/utils/createJWT.ts` 을 만든다.

> **NOTE:**
> 
> ### JWT (JSON Web Token)
> 웹표준(RFC7519)으로서 두 개체에서 JSON 객체를 사용하여 가볍고 자가수용적인(self-contained) 방식으로 정보를 안전성 있게 전달해준다. JWT는 서버와 클라이언트 간 정보를 주고 받을 때 HTTP Request Header에 JSON 토큰을 넣은 후 서버는 별도의 인증 과정없이 헤더에 포함되어 있는 JWT 정보를 통해 인증한다. 이때 사용되는 JSON 데이터는 URL-Safe 하도록 URL에 포함할 수 있는 문자만으로 만들게 된다. JWT는 HMAC 알고리즘을 사용하여 비밀키 또는 RSA를 이용한 `Public Key/Private Key` 쌍으로 서명할 수 있다. 여기서 `Private Key` 나 `SECRET KEY` 는 같은 개념이다.
> 
> ### Token?
> 여러 단말기들에 접근을 제어하기 위한 매체이다. 다른 말로 Media Access Control(매체 접근 제어)이라고 한다. 제어 토큰은 서버로부터 접근 권한을 부여 받는다. <br>
> 
> ![JWT Example](https://lh3.googleusercontent.com/g4u0d-9a5ynDLg9C7f-pp7xlwbG-Ny1GWKsAmUegz-yv9oYsTWXB7Yx_Q6nj1s-__wQISLdtT8btsLDZGNmaGyS09Jc4LqQtiIx_nCnrQOE0-nIlZqWflp7-KfPjP3Jlsm2msVfV2Q=w1080)
> 
> https://jwt.io/
>
> 토큰을 만들기 위해서는 `Header`, `Payload`, `Verify Signature` 이렇게 3가지가 필요하다. 
> - `Header` : 위 3가지 정보를 암호화할 방식(alg: 알고리즘), 타입(type) 등.
> - `Payload` : 서버에서 보낼 '실제 데이터'. 일반적으로 사용자의 고유 ID값, 유효기간이 들어간다.
> - `Verify Signature` : Base64 방식으로 인코딩한 `Header`, `Payload` 그리고 `SECRET KEY`를 더한 후 서명한다. `Public Key` 는 누구에게든 '배포' 할 수 있다. 그러나 '복호화'하는 것은 `Private Key(SECRET KEY)` 가 있어야만 가능하다. '공인 인증서' 발급/인증 과정과 같다.
>

우선 JWT 가 어떻게 이루어지는지 진행과정을 간략하게 다룰 필요가 있다.

### JWT 진행과정 <br>
![JWT Progress](https://lh3.googleusercontent.com/kY63eJiIsGXslgFxHNWnQUls3rrTj1d2LDcEmR-BCi3RZHTD7GzvU6w-MzwLh5m2GC8uu6xQE9N-rfeNYec9vSI-b5DYQv_YsypDC4h6OzOWy5uY9mO9HFrCjYVWihtLOSljK3V4gg=w640)

1. 사용자 로그인
2. 서버에서는 계정정보를 읽어 사용자를 확인 후, 사용자의 고유한 ID값을 부여하고 기타 정보와 함께 `Payload`에 넣는다.
3. 발급 전에 JWT 토큰의 유효기간을 설정한다.
4. 암호화할 `SECRET KEY`를 이용해 Access Token을 발급
5. 사용자는 Access Token을 받아 저장 후, 인증이 필요한 요청마다 토큰을 헤더에 실어 보낸다.
6. 서버에서는 해당 토큰의 `Verify Signature`를 `SECRET KEY`로 디코딩 후, 조작 여부, 유효기간을 검증
7. 검증이 완료되면, `Payload`를 디코딩하여 사용자의 ID에 맞는 요청 데이터를 찾고 다시 전달한다.

6, 7번 과정에서 `SECRET KEY` Decoding(복호화)인지 `Payload` Decoding 인지를 구분해야 한다.

**참고:** 
https://velopert.com/2350, https://tansfil.tistory.com/58

`createJWT.ts` 에서 구현할 과정은 사용자의 고유 ID 를 받으면 JWT 를 생성하는 일이다 (이미지 3번 과정).

```typescript
import jwt from "jsonwebtoken";

const createJWT = (id: number): string => {
   const token = jwt.sign({ id }, process.env.JWT_TOKEN);
   return token;
};

export default createJWT;
```

- `jsonwebtoken` 모듈을 불러오기 하고 `createJWT` 함수를 만든다. `number` 타입의 `id` 를 매개변수로 받고 반환할 `token` 은 `string` 타입이 될 것이다.
- 이제 `token` 을 만드는데 우선 두개의 인자가 필요하다. 첫번째는 `id`, 두번째는 `Private Key(SECRET KEY)` 를 생성해주는 양식이다.
- 두번째 인자는 중요하기 때문에 `.env` 환경변수에 저장해 가져오도록 한다. https://passwordsgenerator.net/ 에 접속해 `Private Key(SECRET KEY)`를 생성해주는 옵션들을 선택하고 Generate Password 버튼을 클릭, 양식을 복사한다. 복사한 양식을 `.env` 파일에 `JWT_TOKEN=` 에 붙여넣기 한다. 그리고 `process.env.JWT_TOKEN` 으로 가져온다.

----

## # 1.42 Custom JWT로 사용자 인증

JWT 진행과정에서 실제로 Token 발급을 하고 Client 측으로 전달하는 부분을 적용시켜보자. 우선 `src/api/User/FacebookConnect/FacebookConnet.resolvers.ts` 로 다시 돌아가서 다음 `createJWT` 함수를 추가한다.

#### FacebookConnet.resolvers.ts
```typescript
...

import createJWT from "../../../utils/createJWT"; // createJWT 모듈 불러오기

const resolvers: Resolvers = {
  Query: {
    ...
  },
  Mutation: {
    FacebookConnect: async (
      _,
      args: FacebookConnectMutationArgs,
    ): Promise<FacebookConnectResponse> => {
      const { fbID } = args;
      try {
        // 먼저 Facebook ID 가 이미 존재하는지 확인
        const existingUser = await User.findOne({ fbID });
        // console.log("Facebook 기존 사용자: ", existingUser);
        // 이미 로그인한 사용자가 있다면
        if (existingUser) {
          const token = createJWT(existingUser.id); // #1. JWT Token 추가
          return {
            ok: true,
            error: null,
            token,
          };
        }
      } catch (error) {
        return {
          ok: false,
          error: error.message,
          token: null,
        };
      }

      try {
        // 새로운 사용자를 생성하고 데이터베이스 저장/업데이트
        const newUser = await User.create({
          ...args,
          profilePhoto: `http://graph.facebook.com/${fbID}/picture?type=square`,
        }).save();
        // console.log("Facebook 새로운 사용자: ", newUser);
        const token = createJWT(newUser.id); // #2. JWT Token 추가
        return {
          ok: true,
          error: null,
          token,
        };
      } catch (error) {
        return {
          ok: false,
          error: error.message,
          token: null,
        };
      }
    },
  },
};

...
```

`FacebookConnect.resolvers.ts` 에서 두 개의 `createJWT` 함수를 만들었는데 둘다 사용자 로그인 정보인 `fbID` 를 이용해 DB 회원정보를 `User.findOne({ fbID })` 통해 찾고, 있다면 사용자 ID 로 Token 을 생성하고 결과를 포함시켜 Client 에 응답으로 보낸다.

다음은 `EmailSignUp.resovlers.ts` 에도 새로운 가입자 일때 Token 을 통해 응답하도록 설정한다.

#### EmailSignUp.resolvers.ts
```typescript
...

import createJWT from "../../../utils/createJWT";

const resolvers: Resolvers = {
  Mutation: {
    EmailSignUp: async (
      _,
      args: EmailSignUpMutationArgs,
    ): Promise<EmailSignUpResponse> => {
      const { email } = args;
      // 기존에 있는 사용자는 가입이 아니라 로그인
      try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return {
            ok: false,
            error: "이미 가입된 사용자, 대신 로그인 합니다.",
            token: null,
          };
        } else {
          const newUser = await User.create({ ...args }).save();
          const token = createJWT(newUser.id); // # JWT Token 추가
          return {
            ok: true,
            error: null,
            token,
          };
        }
      } catch (error) {
        return {
          ok: false,
          error: error.message,
          token: null,
        };
      }
    },
  },
};

...
```

그리고 `CompletePhoneVerification.resolvers.ts` 에도 폰인증이 완료되었다는 응답을 해줘야할 부분에 Token 을 추가한다.

#### CompletePhoneVerification.resolvers.ts
```typescript
...

import createJWT from "../../../utils/createJWT";

const resolvers: Resolvers = {
  Mutation: {
    CompletePhoneVerification: async (
      _,
      args: CompletePhoneVerificationMutationArgs,
      ): Promise<CompletePhoneVerificationResponse> => {
      const { phoneNumber, key } = args;
      
      try {
        ...
      } catch (error) {
        ...
      }

      try {
        const user = await User.findOne({ phoneNumber });
        if (user) {
          user.verifiedPhoneNumber = true;
          user.save();
          // # JWT Token 추가
          const token = createJWT(user.id);
          return {
            ok: true,
            error: null,
            token,
          };
        } else {
          return {
            ok: true,
            error: null,
            token: null,
          };
        }
      } catch (error) {
        return {
          ok: false,
          error: error.message,
          token: null,
        };
      }
    },
  },
};

...
```

여기까지가 사용자가 가입을 하고 가입정보를 이용해 회원 DB에서 회원 여부를 찾고, 없으면 새로운 가입자로 저장하며 결과를 Token 발급을 통해 전달한다. 가입정보 확인이나 휴대폰 인증 완료 또한 이전에 발급 받았던 Token 으로 검증된다.

---

## #1.43 Testing Authentication Resolvers

#### Facebook 접속 인증 테스트
<image src="https://drive.google.com/uc?id=1fJjj6JDWUgRcuWV6tNPS2qJ0mzq3Fsmh" alt="Facebook 접속 인증 테스트" width="960">

#### 핸드폰 인증 테스트
<image src="https://drive.google.com/uc?id=1IdHo7tjb_v66j321OMLz-BxlEtA_bNDl" alt="핸드폰 인증 테스트" width="960">

#### 이메일 가입 인증 테스트
<image src="https://drive.google.com/uc?id=12Umrkq3sica7wkDqIC0cAF26mJWMrclj" alt="이메일 가입 인증 테스트" width="960">

이메일 가입여부를 PostgresQL 에서 사용자의 DB 리스트가 생성된 것을 볼 수 있다.

<image src="https://drive.google.com/uc?id=1HvaAE53ATtttILHBTIccSolDJvtuHQiZ" alt="PostgresQL DB Search" width="960">


테스트는 `EmailSignUp`, `EmailSignIn`, `FacebookConnect` 순으로 하는 것이 좋다. 왜일까?
`FacebookConnect` 을 먼저하고 `EmailSignUp` 하면 비밀번호 업데이트는 안된 상태기 때문에 `null` 이 된다. `EmailSignUp` 은 단지 `email` 로 사용자 여부를 찾기 때문에 비밀번호 업데이트 없는 `if(exsitingUser)` 로 넘어간다.

그 다음 `EmailSignIn` 에서 비밀번호를 넣어도 추가된 비밀번호가 없기 때문에 비교 대상인 hash 된 비밀번호가 필요하다고 나온다. `"Error: data and hash arguments required"`  반대로 `EmailSignUp` 을 하고 `FacebookConnet` 하면 어떻게 될까? 이것은 서로 다른 고유 `id` 식별자로 생성된다.

현재까지 테스트 차원에서 확인해보는 것이고 아직 미완성 코드라는 점을 참고한다.

----

## #1.44 Custom Auth Middleware on Express

반대로 Client 측에서 Server 측으로 JWT 를 받아 열어볼 때는 어떻게 해야 할까? 아주 간단하다. `src/app.ts` 파일에 JWT 를 받으면 열어보는 Middleware 를 만들면 된다.

우선 JWT 복호화 해줄 모듈이 필요하다. 그 모듈을 `src/utils/decodeJWT.ts` 로 한다.

#### decodeJWT.ts
```typescript
import jwt from "jsonwebtoken";
import User from "../entities/User";

// Custom Middleware, 사용자(Client) 측에서 받은 token 을 복호화, 반환은 DB 사용자 정보거나 없을 수 있다.
const decodeJWT = async (token: string): Promise<User | undefined> => {
  try {
    // Private Key 로 Token 을 복호화해 인증한다.
    const decoded: any = jwt.verify(token, process.env.JWT_TOKEN || "");
    const { id } = decoded;
    const user = await User.findOne({ id });
    return user;
  } catch (error) {
    return undefined;
  }
};

export default decodeJWT;
```

- Custom Middleware 인 `decodeJWT` 는 사용자(Client) 측에서 받은 Token 을 복호화 한다. 반환은 DB 사용자 정보거나 없을 수 있다.
- `jsonwebtoken` 모듈을 불러와 `jwt.verify()` 함수를 이용해 인자로 받은 Token 을 환경변수에 저장한 `Private Key` 로 복호화 한다.
- 복호화된 정보에서 사용자 ID 를 받아 사용자 여부를 조회한다.

#### app.ts
```typescript
...

import decodeJWT from "./utils/decodeJWT"; // #1. JWT 복호화 모듈 불러오기

class App {
  public app: GraphQLServer;
  constructor() {
    this.app = new GraphQLServer({
      schema,
      // #4. 요청이 들어올 시 전달할 Context, 모든 Resolver 에서 사용가능
      context: req => {
        return {
          req: req.request,
        };
      },
    });
    this.middlewares();
  }
  private middlewares = (): void => {
    this.app.express.use(cors());
    this.app.express.use(logger("dev"));
    this.app.express.use(helmet());
    this.app.express.use(this.jwt); // #2. JWT 복호화 Middleware 를 연결한다.
  };

  // #3. Client 로 부터 받은 JWT_TOKEN 을 복호화
  private jwt = async (
    req,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // 들어온 Token 중에 해당 HTTP Header 가 있는지 조회(Header 이름은 아무거나 상관없다.)
    const token = req.get("X-JWT");
    if (token) {
      const user = await decodeJWT(token);
      if (user) {
        req.user = user;
      } else {
        req.user = undefined;
      }
    }
    next();
  };
}

...
```

- ID 를 갖고 암호화시켰기 때문에 복호화도 ID 로 해야 한다. `private` 함수인 `jwt` 를 만들고 `"X-JWT"` 헤더를 가진 Token 을 조회한다. 가져온 Token 을 복호화하고 사용자가 누군지 반환 받는다.
- 복호화 후 `req.user = user` 를 한 이유는 `req` 라는 객체에 `user` 정보를 넣음으로써 모든 요청은 Middleware 를 거치면서 어디든 `user` 정보를 전달할 수 있게 함이다. 결국 `req.user` 정보는 `new GraphQLServer({ ... }`) 로 들어가게 되면서 `context` 를 통해 GraphQL 의 모든 Resolver 는 이 정보를 사용할 수 있게 된다.

----

## #1.47 GetMyProfile Resolver

이제 GraphQLServer 에서 `context` 를 통해 어떤 Resolver 든 사용자의 정보를 활용할 수 있게 되었다. 그런데 한가지 문제점은 '사용자 정보를 어떻게 보호할 것인가?' 이다. 그래서 다음은 **Currying** 기법을 사용해 사용자 정보를 보호하고 프로파일을 불러오는 방법을 알아본다.

> **NOTE:**
> 
> ### **Currying?**
> 
> 특정 함수에 정의된 인자를 가져와서 다른 함수의 인자와 합쳐 전혀 새로운 프로세스를 만드는 것을 말한다. 단순하게 말해서 특정 조건의 인자들이 충족되고 모이면 한꺼번에 실행된 결과를 받는 것이다. 
> 
> ```javascript
> const notCurry = (x, y, z) => x + y + z; // a regular function
> const curry = x => y => z => x + y + z; // a curry function
> ```
> 
> 예를들어 `curry(1)` 를 호출하면 `y => z => 1 + y + z` 가 반환된다. `curry(1)(2)` 를 호출한다고 하면 `z => 1 + 2 + z` 가 반환된다. 다시 이런식으로 반환된 함수에 마지막 인자를 보내 `curry(1)(2)(3)` 처럼 호출한다면 최종적으로 `1 + 2 + 3` 의 결과가 되는 것이다.
> 

우선 `src/api/User/GetMyProfile` 디렉토리에 `GetMyProfile.graphql`, `GetMyProfile.resolvers.ts` 파일을 생성한다.

#### GetMyProfile.graphql
```graphql
type GetMyProfileResponse {
  ok: Boolean!
  error: String
  user: User
}

type Query {
  GetMyProfile: GetMyProfileResponse!
}
```

#### GetMyProfile.resolvers.ts
```typescript
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

// privateResolver 호출은 GetMyProfile: async (parent, args, context, info) => {...} 처럼 된다.
const resolvers: Resolvers = {
  Query: {
    GetMyProfile: privateResolver(async (_, __, { req }) => {
      const { user } = req;
      return {
        ok: true,
        error: null,
        user,
      };
    }),
  },
};

export default resolvers;
```

- `GetMyProfile` 메소드에서 매개변수인 `{ req }` 로 `context.req` 를 바로 가져온다.
- `const { user } = req;` 는 `context.req.user` 로서 사용자 정보를 담는다.
- 자세히보면 `privateResolver` 함수로 감싸 호출한 것을 볼 수 있다. 이것은 Resolver 를 보호하는 역할을 한다.

`src/utils/privateResolver.ts` 의 코드는 다음과 같다.

#### privateResolver.ts
```typescript
// privateResolver 를 호출하는 쪽에선 resolverFunction 을 필요시에 호출이 가능하도록 설정만 할 것이다.
const privateResolver = resolverFunction => async (parent, args, context, info) => {
  // context 요청에 user 가 없다면 에러
  if (!context.req.user) {
    throw new Error("JWT 가 없습니다. 처리 과정에서 거부되었습니다.");
  }
  const resolved = await resolverFunction(parent, args, context, info);
  return resolved;
};

export default privateResolver;
```

앞서 설명한 Currying 기법을 사용해 `resolverFuntion` 라는 함수 인자와 `parent`, `args`, `context`, `info` 를 차례대로 받는다. 결국 이 인자들은 `resolverFuncion(parent, args, context, info)` 호출로 구성되어 만난다.

그렇다면 `GetMyProfile.resolvers.ts` 에서 `GetMyProfile` 호출은 다음과 같은 결과를 가지게 된다.

```typescript
...

GetMyProfile: async (parent, args, context, info) => {
  if (!context.req.user) {
    throw new Error("JWT 가 없습니다. 처리 과정에서 거부되었습니다.");
  }
  const resolved = async (_, __, { req }) => {
    const { user } = req;
    return {
      ok: true,
      error: null,
      user,
    };
  };
  return resolved;
}

...
```

결국 `resolverFunction` 인자로 보낸 익명 함수는 사용자 Currying 에 맞게 설정만 되는 것이고 실제로 `GetMyProfile` 이 호출되어야 `resolved` 결과를 반환 받는 것이다. `http://localhost:4000/graphql` 테스트 결과 잘 동작한다.

<image src="https://drive.google.com/uc?id=12JCY3_wVSM_VGvQO2hyzILb-NyN3_WSt" alt="GetMyProfile Test" width="960">

현재까지 우리가 작업한 리스트를 보면 **프로파일 조회**까지에 해당된다. `GetMyProfile` 로 프로파일 조회는 완료 되었다. 그리고 이전에 `EmailSignUp` 만 했지 이메일을 Verify 하지는 않았기 때문에 다음 절에는 이메일 인증 확인 과정을 다룬다.

----

## #1.49 Sending Confirmation Email

여기서는 이메일 인증을 위한 API 를 얻고 적용시키는 작업을 한다. 그리고 이미 폰번호를 인증 받은 사용자만이 이메일 가입을 할 수 있다는 것을 전제로 한다.

이전 과정에서 SMS 인증을 위해 Twilio RESTful Service 이용했다. 이메일 인증 또한 서비스를 이용할 것이다. [mailgun](https://www.mailgun.com) 사이트를 방문해 가입한다. 가입이 완료되고 난 후 Sandbox Domain, API 키가 필요하다. Trial 가입 상태인 경우 이메일을 보내는 정도로만 가능하다. 나 아닌 다른 사용자로 보내고 싶다면 유료를 이용해야 한다.

<img src="https://drive.google.com/uc?id=1CpeJ9DPH_vnz3n9ddds1hsuTFo9NilTB" alt="mailgun basic 01" width="960">

가입을 한다.

<img src="https://drive.google.com/uc?id=1lpS1Qlt9Mwc2-q69uNkvSdT7WgPw-Ycc" alt="mailgun basic 02" width="960">

하단에 Sandbox Domain 을 클릭한다. 여기서 Domain 이란 IP 주소를 사용자가 원활하게 사용할 수 있도록 문자로 표현한 주소 체계를 말한다.(주의⚠️: 데이터베이스의 도메인과는 다르다.) 이 도메인 주소도 나중에 필요하다.

<img src="https://drive.google.com/uc?id=1-OGlEWev9LgJ2Qj34oFo5tqtXGTAQ6xn" alt="mailgun basic 03" width="960">

개발 API 를 선택해 API Key 를 얻는다.

<img src="https://drive.google.com/uc?id=1JArrSV6B_d8-A8HUzPZ3q3nTR6vFC7q9" alt="mailgun basic 04" width="960">

그리고 우측 상단에 Authorized Recipients(인증 수령인) 에 보낼 이메일을 기입한다.

<img src="https://drive.google.com/uc?id=10Qw2adZJEMyzzvO4ieW_o95mE1DpytZt" alt="mailgun basic 05" width="960">

이전에 mailgun 에서 얻은 API Key 를 환경변수 `.env` 에 `MAILGUN_API_KEY` 라는 변수로 Private API 키를 저장한다. 이제 `mailgun-js` 모듈과 타입체크를 설치한다.

```bash
$ yarn add mailgun-js && yarn add @types/mailgun-js --dev
```

그리고 `src/utils/sendEmail.ts` 파일을 만들고 다음과 같이 코드를 적용한다.

#### sendEmail.ts
```typescript
import Mailgun from "mailgun-js";

// #1 새 이메일 인증 API 생성
const mailGunClient = new Mailgun({
  apiKey: process.env.MAILGUN_API_KEY || "",
  domain: "sandbox05dde9843f514a26ba4f34990af4a58b.mailgun.org",
});

// #2 이메일 인증 API 를 통해 전달할 대상과 내용들
const sendEmail = (subject: string, html: string) => {
  const emailData = {
    from: "User@mail.com",
    to: "User@mail.com", // 테스트를 위해 수신도 같은 이메일을 사용하지만 Product 시에는 변경해야 한다.
    subject,
    html,
  };
  return mailGunClient.messages().send(emailData);
};

// #3 실제로 인증 이메일을 보내기
export const sendVerificationEmail = (fullName: string, key: string) => {
  const emailSubject = `안녕하세요. ${fullName}님, 당신의 이메일 인증입니다.`;
  const emailBody = `<a href="http://nuber.com/verification/${key}/">여기<a>를 클릭해 당신의 이메일을 인증해주세요.`;
  sendEmail(emailSubject, emailBody);
};
```

- Mailgun 생성자로 `apiKey`, `domain` 을 등록해 새로운 인증 이메일을 생성한다.
- 실제로 이메일을 보내기 위한 `sendEmail` 함수를 만들어 송수신자 이메일 주소와 이메일 타이틀, 이메일 내용을 설정한다.
- 인증 이메일 보내기 전에 수신 대상자 이름과 인증받을 Key 이렇게 두개의 인자를 포함시키는 `sendVerificationEmail` 함수를 만든다.

#### EmailSignUp.resolvers.ts
```typescript
import User from "../../../entities/User";
import Verification from "../../../entities/Verification";
import {
	EmailSignUpMutationArgs,
	EmailSignUpResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import createJWT from "../../../utils/createJWT";
import { sendVerificationEmail } from "../../../utils/sendEmail";

const resolvers: Resolvers = {
  Mutation: {
    EmailSignUp: async (
      _,
      args: EmailSignUpMutationArgs,
    ): Promise<EmailSignUpResponse> => {
      const { email } = args;
      // 기존에 있는 사용자는 가입이 아니라 로그인
      try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return {
            ok: false,
            error: "이미 가입된 사용자, 대신 로그인 합니다.",
            token: null,
          };
        } else {
          // 폰인증을 받은 사용자만이 이메일 가입이 가능하다.
          const phoneVerification = await Verification.findOne({
            payload: args.phoneNumber,
            verified: true,
          });
          if (phoneVerification) {
            const newUser = await User.create({ ...args }).save();
            // 이메일을 사용자가 input 했다면 새로운 인증을 받아야 한다.
            if (newUser.email) {
              const emailVerification = await Verification.create({
                payload: newUser.email,
                target: "EMAIL",
              }).save();
              await sendVerificationEmail(
                newUser.fullName,
                emailVerification.key,
              );
            }
            const token = createJWT(newUser.id);
            return {
              ok: true,
              error: null,
              token,
            };
          } else {
            return {
              ok: false,
              error: "당신의 폰번호는 인증되지 않았습니다.",
              token: null,
            };
          }
        }
      } catch (error) {
        return {
          ok: false,
          error: error.message,
          token: null,
        };
      }
    },
  },
};

export default resolvers;
```

- `EmailSignUp` 은 `if (existingUser)` 로 기존 사용자인지 이메일로 확인을 한다.
- 폰인증을 받은 사용자만 이메일 가입이 가능하다. 먼저 `if (phoneVerification)` 로 폰인증 이력이 있는지 확인한다. 이것을 하지 않으면 폰인증을 이미 받았는데도 이메일 인증을 따로 받게되고 또 다른 사용자로 등록된다.
- `if (newUser.email)` 을 통과하고 `Verification` 을 새로 생성한다. 그 다음 `.save()` 한다. 만일 저장하지 않는다면 받는 쪽에서 `undefined` 로 나타난다. 왜냐하면 Verification Entity 에서 `@BeforeInsert()` 가 동작하지 않기 때문이다.
    ```typescript
    @Entity()
    class Verification extends BaseEntity {

      ...

      @BeforeInsert()
      createKey(): void { ... }

    }
    ```
- 새로 가입한 사용자는 DB 에 저장, `{ ...args }` 를 사용한 이유는 User Scheme 중에 `EmailSignUpMutationArgs` 에 정의된 Entity(`firstName`, `lastName`, `email`, `password`, `profilePhoto`, `age`, `phoneNumber`)로 생성될 것이다.
- 이제 새로운 사용자 이메일이 기입되면 그 이메일로 새로운 인증을 생성하고 인증된 이력을 저장한다.
- 저장 후 사용자 이름인 `newUser.fullName` 과 새로 생성된 키 `emailVerification.key` 를 `sendVerificationEmail` 로 인증 이메일을 전달한다.

> **주의⚠️:**
> 
> 테스트 시 `EmailSignUp` 보다 `FacebookConnect` 을 먼저 한다면 기존 사용자로 인식하기 때문에 새로운 비밀번호가 적용되지 않는다. 나중에 `EmailSignIn` 에서 비교할 비밀번호가 없기 때문에 `bcrypt.compare Error` 가 발생한다.

폰번호 인증이 되어 있다는 가정하에 테스트를 진행한 결과는 다음과 같다. `EmailSignUp` 을 서버로 전달한다.

<img src="https://drive.google.com/uc?id=1Cp_k5k8O76KFYI4VHQLgxzBp4p2OUVzH" alt="Testing Email Sending 02" width="960">

자신의 이메일로 인증이 날라온다. (주의⚠️: 스팸메일로 들어가지 않도록 한다.)

<img src="https://drive.google.com/uc?id=1LVO3E9CfwwD-jJSUslBmJG8oR-PF1qk0" alt="Testing Email Sending 01" width="960">

mailgun 사이트 log 정보에서도 확인이 가능하다.

<img src="https://drive.google.com/uc?id=1yP_ImlhyAugbwAZfscFqysgaInI4PFds" alt="Testing Email Sending 03" width="960">

'여기'를 클릭하면 인증 완료된 `nuber.com/verification/${key}` 사이트로 이동한다. 사용자에게 보낸 인증키가 URL 에 담긴 것을 볼 수 있다.

<img src="https://drive.google.com/uc?id=1K6Hr3LPwhlhc99PazqEOI6XcxZSDzkb1" alt="Testing Email Sending 04" width="960">

----

## #1.53 RequestEmailVerification Resolver

사용자는 이메일 가입이 과정과는 별개로 기존에 받은 인증과는 상관없이 새 이메일 인증을 받아야 하는 경우가 있다. 예를들어 새로운 이메일로 인증을 받고 싶다거나 기존 이메일이 더이상 쓸 수 없어 업데이트 해야할 경우를 들 수 있다.

#### RequestEmailVerification.graphql
```graphql
type RequestEmailVerificationResponse {
  ok: Boolean!
  error: String
}

type Mutation {
  RequestEmailVerification: RequestEmailVerificationResponse!
}
```

#### RequestEmailVerification.resolvers.ts
```typescript
import User from "../../../entities/User";
import Verification from "../../../entities/Verification";
import { RequestEmailVerificationResponse } from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";
import { sendVerificationEmail } from "../../../utils/sendEmail";

const resolvers: Resolvers = {
  Mutation: {
    RequestEmailVerification: privateResolver(
      async (_, __, { req }): Promise<RequestEmailVerificationResponse> => {
        const user: User = req.user;
        // #1 작성된 이메일이 인증이 안된 새로운 이메일이라면
        if (user.email && !user.verifiedEmail) {
          try {
            // #2 이전에 인증된 이메일은 DB에서 제거한다.
            const oldVerification = await Verification.findOne({
              payload: user.email,
            });
            if (oldVerification) {
              oldVerification.remove();
            }
            // #3 새로운 이메일 인증 생성, DB에 저장해 나중에 인증을 완료할 때 key 를 확인한다.
            const newVerification = await Verification.create({
              payload: user.email,
              target: "EMAIL",
            }).save();
            // #4 Client 이메일 인증을 위한 Private Key 전송
            await sendVerificationEmail(user.fullName, newVerification.key);
            return {
              ok: true,
              error: null,
            };
          // 인증이 안된 경우
          } catch (error) {
            return {
              ok: false,
              error: error.message,
            };
          }
        // #5 나머지는 이메일 인증이 완료된 경우, 인증 받을 이메일이 없는 경우
        } else {
          return {
            ok: false,
            error: "사용자가 인증할 이메일이 없습니다.",
          };
        }
      },
    ),
  },
};

export default resolvers;
```

- 우선 작성된 이메일이 인증이 안된 것만 가능하도록 `if (user.email && !user.verifiedEmail)` 을 거친다.
- DB 에서 기존에 저장했던 이메일은 제거하고 이메일 인증을 새로 받고 저장한다. DB 에 저장함으로써 나중에 인증 완료 과정인 `CompleteEmailVerification` 을 통해 Key 를 확인하고 인증을 완료한다. 
- 그외 나머지는 인증이 완료되지 않은 경우이거나 인증해야할 이메일이 없는 경우다.

테스트 결과는 다음과 같다.

<img src="https://drive.google.com/uc?id=15MS4OmBaYiep8wz5ftWQa307uRXmaUPF" alt="Request Email Verification" width="960">

----

## #1.54 CompleteEmailVerification Resolver

인증 요청을 하면 인증이 맞는지 확인하고 완료되었다는 이력을 남기는 작업이 필요하다.

#### CompleteEmailVerification.graphql
```graphql
type CompleteEmailVerificationResponse {
  ok: Boolean!
  error: String
}

type Mutation {
  CompleteEmailVerification(key: String!): CompleteEmailVerificationResponse!
}
```

#### CompleteEmailVerification.resolvers.ts
```typescript
import User from "../../../entities/User";
import Verification from "../../../entities/Verification";
import {
  CompleteEmailVerificationMutationArgs,
  CompleteEmailVerificationResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
  Mutation: {
    CompleteEmailVerification: privateResolver(
      async (
        _,
        args: CompleteEmailVerificationMutationArgs,
        { req },
      ): Promise<CompleteEmailVerificationResponse> => {
        const user: User = req.user;
        const { key } = args;
        // 사용자의 이메일은 있지만 인증이 완료되지 않은 경우
        if (user.email) {
          try {
            // 이메일과 key 로 사용자를 찾는다.
            const verification = await Verification.findOne({
              key,
              payload: user.email,
            });
            if (verification) {
              user.verifiedEmail = true;
              user.save();
              return {
                ok: true,
                error: null,
              };
            } else {
              return {
                ok: false,
                error: "이메일을 확인할 수 없습니다.",
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
            error: "인증할 이메일이 없습니다.",
          };
        }
      },
    ),
  },
};

export default resolvers;
```

`EmailSignUp`, `RequestEmailVerification` 처럼 이메일 인증 요청이 발생했다. 인증 완료를 위해 `user.email`, `key` 를 조회해서 사용자가 있는지 확인하고, 있다면 `user.verifiedEmail = true` 로 업데이트해 인증이 완료되었음을 저장한다. 테스트 결과는 다음과 같다.

<img src="https://drive.google.com/uc?id=11lQRgV9gaDOlSh_9WhrLjEXPeb-5QpwH" alt="Complete Email Verification" width="960">

----

## #1.56 UpdateMyProfile Resolver

#### UpdateMyProfile.graphql
```graphql
type UpdateMyProfileResponse {
  ok: Boolean!
  error: String
}

type Mutation {
  UpdateMyProfile(
    firstName: String
    lastName: String
    email: String
    password: String
    profilePhoto: String
    age: Int
  ): UpdateMyProfileResponse!
}
```

#### UpdateMyProfile.resolvers.ts
```typescript
import User from "../../../entities/User";
import {
  UpdateMyProfileMutationArgs,
  UpdateMyProfileResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import cleanNullArgs from "../../../utils/cleanNullArgs";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
  Mutation: {
    UpdateMyProfile: privateResolver(
      async (
        _,
        args: UpdateMyProfileMutationArgs,
        { req },
      ): Promise<UpdateMyProfileResponse> => {
        const user: User = req.user;
        // null type 들을 걸러낸 나머지 인자들
        const notNull: any = cleanNullArgs(args);
        if (notNull.password !== null) {
          user.password = notNull.password;
          user.save();  // 실제로 비밀번호 업데이트 이뤄지는 부분
          delete notNull.password; // Hashing 되지 않은 password 가 다시 저장되지 않도록 notNull.password 를 삭제
        }
        try {
          await User.update({ id: user.id }, { ...notNull });
          return {
            ok: true,
            error: null,
          };
        } catch (error) {
          return {
            ok: false,
            error: error.message,
          };
        }
      },
    ),
  },
};

export default resolvers;
```

- `User.update()` 함수에서 두번째 인자로 `{ ...args }` 를 업데이트로 넘기면 Type 에러가 난다. `null` 인 Type 들은 User Scheme 에서 충돌하기 때문이다. User Type 들은 `null` 이 없는 필수(`!`로 지정된) Type 들로 지정되어 있기 때문에 이를 위해 `null` 로 들어오는 인자들을 걸러내는 과정이 필요하다.
- `cleanNullArgs` 으로 걸러낸 `notNull` 인자들 중에서 `password` 를 `user.password` 로 지정해 업데이트 한다.
  
  ```typescript
  const cleanNullArgs = (args: object): object => {
    const notNull = {};
    Object.keys(args).forEach(key => {
        if (args[key] !== null) {
          notNull[key] = args[key];
        }
      });
    return notNull;
  };

  export default cleanNullArgs;
  ```
- 그러나 실제로 업데이트 되지 않는다. 왜일까? 그 이유는 `const user: User = req.user;` 에서 `user` 는 User Entity 의 Instance 가 아니기 때문이다. User Instance 란 DB 에서 선택하고 확인하며 찾은 객체 데이터를 말한다. 만약 `User.findOne()` 으로 대상을 찾아 변수에 담았다면 그것이 바로 User Instance 가 된다. 그런데 여기선 그런 과정이 없다. 이전에 User Entity 를 구성했을 때 비동기 함수인 `savePassword` 적용해 비밀번호를 Hashing 했다. 그리고 User Instance 가 생성되기 전에 작동하라는 의미로 `@BeforeUpdate` 를 적용시켰다. 그러나 실제로 `User.update()` 를 하면 사용자를 로드하지 않으며 `@BeforeUpdate` 가 원하는데로 작동하지 않는다. Typeorm 버그처럼 보이는 이 `update` 메소드는 사용자 존재 여부를 확인하지도 않으며 선택하지도 않기 때문에 `@BeforeUpdate`, `@BeforeInsert` 를 하기 위해선 존재여부를 확인하고 선택해 저장하는 `User.save()` 해야 한다. 결론적으로 `User.update()` 는 User Instance 없이도 업데이트하는 방식인 것이고 우리는 비밀번호를 다시 Hashing 하기 위해서 `User.save()` 를 해야만 했던 것이다. 어쩌면 이것으로 Typeorm 작동방식을 더 잘 알게된 기회가 되었다.
- `delete notNull.password` 은 Hashing 되지 않은 `password` 가 다시 저장되지 않도록 `notNull.password` 를 삭제한다.

테스트 결과는 다음과 같다.

<img src="https://drive.google.com/uc?id=1MjvBg3-nre7dqtpQFVE0pEj29euFa7cK" alt="Update My Profile 01" width="960">

<img src="https://drive.google.com/uc?id=1VysJ5FCxos6UDpiy2YB-7_CZ8s5mwZJF" alt="Update My Profile 02" width="960">

----

## #1.58 ToggleDrivingMode Resolver

Resolver 작업 리스트를 보면 Private Resolver 에서 프로파일 변경/업데이트 까지 진행되었다. 이제 운전 모드 전환을 다뤄보자.

#### ToggleDrivingMode.graphql
```graphql
type ToggleDrivingModeResponse {
  ok: Boolean!
  error: String
}

type Mutation {
  ToggleDrivingMode: ToggleDrivingModeResponse!
}
```

#### ToggleDrivingMode.resolvers.ts
```typescript
import User from "../../../entities/User";
import { ToggleDrivingModeResponse } from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
  Mutation: {
    ToggleDrivingMode: privateResolver(
      async (_, __, { req }): Promise<ToggleDrivingModeResponse> => {
        const user: User = req.user;
        user.isDriving = !user.isDriving; // 현재 운전상태 변경
        user.save(); // DB 저장
        return {
          ok: true,
          error: null,
        };
      },
    ),
  },
};

export default resolvers;
```

`ToggleDrivingMode` 는 단순히 `user.isDriving = !user.isDriving` 을 해주고 상태가 변경된 것을 업데이트 하기만 하면 된다.

----

## #1.59 ReportMovement Resolver

사용자는 위치 정보를 보내는 Resolver 가 필요하다. 이것은 운전자, 승객 둘다 요청시에 각자의 정보를 상대에게 보내는 역할을 한다. 그런데 `User` 에 위치정보나 운전모드 변경에 관련된 정보가 있는데 `UpdateMyProfile` 에서 구현하지 않는 이유는 무엇일까? 왜냐하면 경험상 하나의 Resolver 에 많은 기능을 가지고 있으면 혼란스럽고 효율성이나 유지보수가 힘들어진다. 그리고 상대가 나를 Subscription 했다면 위치정보가 변했다는 것을 알려야 한다. 나중에 Publish, Subscription 에서 다루게 될 것이다.

#### ReportMovement.graphql
```graphql
type ReportMovementResponse {
  ok: Boolean!
  error: String
}

type Mutation {
  ReportMovement(
    lastOrientation: Float
    lastLng: Float
    lastLat: Float
  ): ReportMovementResponse!
}
```

#### ReportMovement.resolvers.ts
```typescript
import User from "../../../entities/User";
import {
  ReportMovementMutationArgs,
  ReportMovementResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import cleanNullArgs from "../../../utils/cleanNullArgs";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
  Mutation: {
    ReportMovement: privateResolver(
      async (
        _,
        args: ReportMovementMutationArgs,
        { req, pubSub },
      ): Promise<ReportMovementResponse> => {
        const user: User = req.user;
        const notNull = cleanNullArgs(args);
        try {
          await User.update({ id: user.id }, { ...notNull });
          const updatedUser = await User.findOne({ id: user.id });
          pubSub.publish("driverUpdate", { DriversSubscription: updatedUser });
          return {
            ok: true,
            error: null,
          };
        } catch (error) {
          return {
            ok: false,
            error: error.message,
          };
        }
      },
    ),
  },
};

export default resolvers;
```

사용자의 위치 정보들을 `arg` 에서 `null` 아닌 것만 모은 `{ ...notNull }` 로 업데이트 한다. 그리고 업데이트 된 결과가 DB 에서 다시 찾아 `"driverUpdate"` 라는 이벤트 이름으로 게시하고 구독한 측에 업데이트 된 데이터 결과를 `{ DriversSubscription: updatedUser }` 로 보낸다.

----

## #1.60 AddPlace Resolver

`src/api/Place/` 디렉토리에 장소를 추가하는 Resolver 를 만들어보자.

#### AddPlace.graphql
```graphql
type AddPlaceResponse {
  ok: Boolean!
  error: String
}

type Mutation {
  AddPlace(
    name: String!
    lat: Float!
    lng: Float!
    address: String!
    isFav: Boolean!
  ): AddPlaceResponse!
}
```

#### AddPlace.resolvers.ts
```typescript
import Place from "../../../entities/Place";
import User from "../../../entities/User";
import { AddPlaceMutationArgs, AddPlaceResponse } from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
  Mutation: {
    AddPlace: privateResolver(
      async (
        _,
        args: AddPlaceMutationArgs,
        { req },
      ): Promise<AddPlaceResponse> => {
        const user: User = req.user;
        try {
          await Place.create({ ...args, user }).save();
          return {
            ok: true,
            error: null,
          };
        } catch (error) {
          return {
            ok: false,
            error: error.message,
          };
        }
      },
    ),
  },
};

export default resolvers;
```

새로운 장소를 추가할 때 요청으로 받은 인자들은 그대로 받고 요청한 사용자를 `{ ...args, user }` 처럼 추가해 생성한다. 그리고 `Place` 와 `User` 간의 관계를 설정해야 한다. `src/api/Place/shared/Place.graphql` 에 `user` 속성을 추가한다.

#### Place.graphql
```graphql
type Place {
  id: Int!
  name: String!
  lat: Float!
  lng: Float!
  address: String!
  isFav: Boolean!
  user: User! #추가
  createdAt: String!
  updatedAt: String
}
```

다음과 같이 `src/entities/Place.ts` 에도 추가한다.

#### Place.ts
```typescript
@Entity()
class Place extends BaseEntity {
  
  ...

  @Column({ type: "double precision", default: 0 })
  lng: number;

  // 추가된 부분
  @ManyToOne(type => User, user => user.places)
  user: User;

  ...

}
```

Type 은 `User` 이고, User Entity 쪽에선 `user.places` 로 장소를 조회할 수 있다. 그러나 아직 User Entity 에는 `user.places` 를 조회 할 수 있는 속성이 없기 때문에 `src/entities/User.ts` 에도 추가한다.


#### User.ts
```typescript
...

import Place from "./Place";

@Entity()
class User extends BaseEntity {
  
  ...

  @OneToMany(type => Ride, ride => ride.driver)
  ridesAsDriver: Ride[];

  // 추가된 부분
  @OneToMany(type => Place, place => place.user)
  places: Place[];

  @CreateDateColumn() createdAt: string;
  
  ...

}

```

`User` 측에선 `Place` 와 관계 설정을 하는 것이기 때문에 `place.user` 도 설정해주도록 한다. 마지막으로 `User.graphql` 에도 추가를 마무리 한다.

```graphql
type User {

  ...

  ridesAsDriver: [Ride]
  places: [Place] # 추가된 부분
  createdAt: String!
  updatedAt: String
}

type Query {
  user: User
}
```

----

## #1.61 EditPlace Resolver

#### EditPlace.graphql
```graphql
type EditPlaceResponse {
  ok: Boolean!
  error: String
}

type Mutation {
  EditPlace(placeId: Int!, name: String, isFav: Boolean): EditPlaceResponse!
}
```

#### EditPlace.resolvers.ts
```typescript
import Place from "../../../entities/Place";
import User from "../../../entities/User";
import { EditPlaceMutationArgs, EditPlaceResponse } from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import cleanNullArgs from "../../../utils/cleanNullArgs";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
  Mutation: {
    EditPlace: privateResolver(
      async (
        _,
        args: EditPlaceMutationArgs,
        { req },
      ): Promise<EditPlaceResponse> => {
        const user: User = req.user;
        try {
          const place = await Place.findOne({ id: args.placeId });
          if (place) {
            // 사용자 id 로 사용자가 즐겨찾는 장소가 맞는지 여부
            if (place.userId === user.id) {
              const notNull: any = cleanNullArgs(args);
              // Update 오류로 인해 다음과 같이 수정, ex) notNull -> { placeId: 1, isFav: true }
              // placeId 는 수정하려고 하는 대상이 아니다. Place Column 의 일부분이 아니어서 오류가 생김
              // 다시말해 placeId 는 찾는 대상이지 수정 대상이 아님
              if (notNull.placeId) { delete notNull.placeId; }
              await Place.update({ id: args.placeId }, { ...notNull });
              return {
                ok: true,
                error: null,
              };
            } else {
              return {
                ok: false,
                error: "확인되지 않았습니다.",
              };
            }
          } else {
            return {
              ok: false,
              error: "장소를 찾지 못했습니다.",
            };
          }
        } catch (error) {
          return {
            ok: false,
            error: error.message,
          };
        }
      },
    ),
  },
};

export default resolvers;
```

Typeorm 은 기본적으로 Relations(`@ManyToOne`, `@OneToMany`...)을 로드하지 않는다. 그래서 두번째 인자로 옵션을 설정하기 위해 일부분(ex: `user`)의 관계만 로드할 수 있다.

```typescript
const place = await Place.findOne({ id: args.placeId }, { relations: ["user"] });
```

그러나 우리는 `User.id` 만 필요로 한다. `{ relations: "[user]" }` 처럼 하게 된다면 필요하지 않은 `User` 전체 속성을 가져온다. Typeorm 에서는 관계된 `id` 만을 로드하는 기능을 지원한다. 다음과 같이 `src/entities/Place.ts` 에 추가한다.

#### Place.ts
```typescript
@Entity()
class Place extends BaseEntity {
  
  ...

  @Column({ type: "double precision", default: 0 })
  lng: number;

  // typeorm 에서는 특정 관계를 이용해 간단히 전체 속성을 로드하는 기능을 가지고 있다. 예를들면 다음과 같다.
  // @RelationId((place: Place) => Place.user)
  // userId: number;
  // 그러나 여기서는 전체 속성을 로드하지 않고 사용자 ID 만 필요하기 때문에 다음과 같이 한다.
  @Column({ nullable: true })
  userId: number;

  @ManyToOne(type => User, user => user.places)
  user: User;

  ...

}
```

해당 Entity 에 `@RelationId` 를 작성하던 Resolver 구현 부분에서 `{ relations: ["user"] }` 하던 둘 중 하나만 설정해도 관계 속성을 로드하는 것은 같다. `src/api/Place/shared/Place.graphql` 에는 `userId` 속성을 추가한다. `Place` 에 `userId` 가 필요한 이유를 생각해보면 조회, 수정, 삭제를 할 때 `Place.userId === user.id` 처럼 어떤 사용자가 자신의 장소를 조회, 수정, 삭제하는 것인지 식별해야 하기 때문에 `userId` 가 필요하다.

#### Place.graphql
```graphql
type Place {
  id: Int!
  name: String!
  lat: Float!
  lng: Float!
  address: String!
  isFav: Boolean!
  userId: Int! # 추가된 부분
  user: User!
  createAt: String!
  updateAt: String
}
```

`await Place.update({ id: args.placeId }, { ...notNull });` 에서 `update` 에러가 발생할 것이다. 예를들어 다음과 같이 `EditPlace` 로 수정을 하게되면

```graphql
mutation {
  EditPlace(placeId: 1, isFav: true) {
    ok
    error
  }
}
```

`EditPlace.resolvers.ts` 에서 `delete notNull.placeId` 처럼 `placeId` 를 제거한 이유는 무엇일까? `notNull` 은 `{ placeId: 1, isFav: true }` 처럼 결과가 나오는데 에러 생긴다. 그것은 바로 `placeId` 는 업데이트 대상이 아니다. 그래서 Place Column 의 일부분이 아니어서 에러가 생기는 것이다. 다시말해 `placeId` 는 찾는 대상이지 수정 대상이 아니다. 결국 `if (notNull.placeId) { delete notNull.placeId; }` 로 `placeId` 를 제외한 인자들만 업데이트 되도록 한다.

----

## #1.62 DeletePlace Resolver

#### DeletePlace.graphql
```graphql
type DeletePlaceResponse {
  ok: Boolean!
  error: String
}

type Mutation {
  DeletePlace(placeId: Int!): DeletePlaceResponse!
}
```

#### DeletePlace.resolvers.ts
```typescript
import Place from "../../../entities/Place";
import User from "../../../entities/User";
import {
  DeletePlaceMutationArgs,
  DeletePlaceResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
  Mutation: {
    DeletePlace: privateResolver(
      async (
        _,
        args: DeletePlaceMutationArgs,
        { req },
      ): Promise<DeletePlaceResponse> => {
        const user: User = req.user;
        try {
          const place = await Place.findOne({ id: args.placeId });
          if (place) {
            if (place.userId === user.id) {
              place.remove();
              return {
                ok: true,
                error: null,
              };
            } else {
              return {
                ok: false,
                error: "확인되지 않습니다.",
              };
            }
          } else {
            return {
              ok: false,
              error: "장소를 찾을 수 없습니다.",
            };
          }
        } catch (error) {
          return {
            ok: false,
            error: error.message,
          };
        }
      },
    ),
  },
};

export default resolvers;
```

`DeletePlace` 는 단순히 `user.id` 를 DB 에서 찾아 `Place` 에 저장된 사용자 식별자인 `userId` 와 같은지 확인하고 제거하는 작업이다.

----

## #1.63 GetMyPlaces Resolver and Testing

#### GetMyPlaces.graphql
```graphql
type GetMyPlacesResponse {
  ok: Boolean!
  error: String
  places: [Place]
}

type Query {
  GetMyPlaces: GetMyPlacesResponse!
}
```

`places` 속성으로 `Place` 배열 데이터를 얻는다.

#### GetMyPlaces.resolvers.ts
```typescript
import User from "../../../entities/User";
import { GetMyPlacesResponse } from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
  Query: {
    GetMyPlaces: privateResolver(
      async (_, __, { req }): Promise<GetMyPlacesResponse> => {
        try {
          const user = await User.findOne(
            { id: req.user.id }, // # 인자1 찾을 조건: 요청 user.id
            { relations: ["places"] }, // # 인자2 관계 Option: user.places 로 관계가 있는 장소를 찾는다.
          );
          // 해당 사용자가 있을 경우
          if (user) {
            return {
              ok: true,
              error: null,
              places: user.places,
            };
          } else {
            return {
              ok: false,
              error: "사용자를 찾지 못했습니다.",
              places: null,
            };
          }
        } catch (error) {
          return {
            ok: false,
            error: error.message,
            places: null,
          };
        }
      },
    ),
  },
};

export default resolvers;
```

장소 조회를 할 때 `user.id` 로 찾는데 `{ relations: ["places"] }` 으로 옵션을 설정한다. 이는 이전에 relation 명목으로 설정한 Entity 의 `@ManyToOne`, `@OneToMany` 가 작동하도록 한다. 실제로 작동하는 User Entity 는 다음과 같다.

```typescript
@OneToMany(type => Place, place => place.user)
places: Place[];
```

결국 `user.places` 결과가 반환된다. 이제 장소를 추가하고 조회하고 수정하는 테스트를 해보자. 우선 장소를 추가한다.

<img src="https://drive.google.com/uc?id=12y75D14HO2ok6jsKzLblAwyS3_Skn7Fh" alt="Testing AddPlace, EditPlace, GetMyPlaces 02" width="960">

조회 해보면 방금 추가된 장소가 나온다.

<img src="https://drive.google.com/uc?id=10VwurcuobFGVf_yHF4mHM_UMvahz1Atr" alt="Testing AddPlace, EditPlace, GetMyPlaces 03" width="960">

장소를 하나 더 추가해보자.

<img src="https://drive.google.com/uc?id=1MX4FXP3hpyl7P7TEl9k2PfVdi1NgkYE1" alt="Testing AddPlace, EditPlace, GetMyPlaces 04" width="960">

역시 전체 장소 결과가 조회된다.

<img src="https://drive.google.com/uc?id=1xdMrsdb8lN0TS5vtq34UjmwWnO4-mK-C" alt="Testing AddPlace, EditPlace, GetMyPlaces 05" width="960">

이제는 즐겨찾기 정보를 `true` 로 업데이트 해보자.

<img src="https://drive.google.com/uc?id=1Qy5ZfzRZE-Jo9IbZkKBh9YBGjyDWVQW-" alt="Testing AddPlace, EditPlace, GetMyPlaces 06" width="960">

`placeId` 가  `1` 인 장소의 즐겨찾기가 `true` 로 변경된 것을 볼 수 있다.

<img src="https://drive.google.com/uc?id=1LQ6BOxG3AysO_YMXSVEScG-yQdNsEP7d" alt="Testing AddPlace, EditPlace, GetMyPlaces 01" width="960">

----

## #1.64 GetNearbyDrivers Resolver

고객 입장에서 운전자가 주변에 있는지 조회가 가능해야 한다.

#### GetNearbyDrivers.graphql
```graphql
type GetNearbyDriversResponse {
  ok: Boolean!
  error: String
  drivers: [User]
}

type Mutation {
  GetNearbyDrivers: GetNearbyDriversResponse!
}
```

우리는 "근처에 있다(Nearby)" 는 것을 표현해야 한다. 현재 고객의 위치에서 위도, 경도가 각각 0.05 씩 크거나 작은 경우로 범위를 산정한다.

#### GetNearbyDrivers.resolvers.ts
```typescript
import { Between, getRepository } from "typeorm";
import User from "../../../entities/User";
import { GetNearbyDriversResponse } from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
  Query: {
    GetNearbyDrivers: privateResolver(
      async (_, __, { req }): Promise<GetNearbyDriversResponse> => {
        const user: User = req.user;
        const { lastLat, lastLng } = user;
        try {
          const drivers: User[] = await getRepository(User).find({
            isDriving: true,
            lastLat: Between(lastLat - 0.05, lastLat + 0.05),
            lastLng: Between(lastLng - 0.05, lastLng + 0.05),
          });
          return {
            ok: true,
            error: null,
            drivers
          }
        } catch (error) {
          return {
            ok: false,
            error: error.message,
            drivers: null
          }
        }
      },
    ),
  },
};

export default resolvers;
```

우리는 지금까지 Typeorm 의 **Active Record** 방식을 사용하면서 Model 자체 내에서 모든 쿼리 방법을 정의하고 모델 방법을 사용하여 개체(Entity)를 저장, 제거 및 로드했다. 간단히 말해 **Model 내에서 데이터베이스에 접근하는 방식**이다. 그래서 Active Record 는 엔터티에 대한 작업을 수행하는 메서드를 제공하는 `BaseEntity` 클래스를 다음과 같이 만들어 확장했다.

```typescript
@Entity()
export class User extends BaseEntity {
  ...
}
```

그런데 **Data Mapper** 접근 방식은 모든 쿼리 메소드를 Repository 라는 별도의 클래스로 정의한다. 그리고 Repository 를 사용하여 객체를 저장, 제거 및 로드한다. 간단히 말해 Model 대신 **Repository 내에서 데이터베이스를 접근하는 방식**이다.

참고 : [Active Record vs Data Mapper](https://github.com/typeorm/typeorm/blob/master/docs/active-record-data-mapper.md#active-record-vs-data-mapper), [ORM Patterns: The Trade-Offs of Active Record and Data Mappers for Object-Relational Mapping
](https://www.thoughtfulcode.com/orm-active-record-vs-data-mapper/)

> **NOTE:**
> 
> ### **Data Mapper**
> 
> Data Mapper 는 데이터 저장소(종종 관계형 데이터베이스)와 메모리 내 데이터 표현 영역(도메인 계층)간에 양방향 데이터 전송을 수행하는 데이터 액세스 계층을 말한다.
> 이것을 사용하는 목적은 데이터 저장소와 메모리 내에 데이터 표현을 서로 독립적으로 유지하기 위해서다. 독립적으로 하는 이유는 만일에 대비해 정전, 메모리 소진, 프로세스 종료가 되더라도 안정적으로 데이터가 데이터베이스에 저장되 있어야 나중에 메모리로 되찾아올 수 있기 때문이다.
>
> ### **Domain**
> 
> 속성(Column)들이 가질 수 있는 모든 값들의 집합이다. 쉽게 말해 '표현되는 속성 값의 범위(영역)'이다. 예를들어 학생 릴레이션이 있다고 한다면 학년 속성의 1학년에서 4학년 까지 범위가 바로 도메인이다.

두 가지 모두 장단점이 있다. 개발에서 항상 명심해야 할 것은 응용 프로그램을 유지 관리하는 방법이다. Data Mapper 는 유지 관리에 용이하며 대형 앱에 유용하다. Active Record 방식은 소규모 앱에 단순하게 유지하기 좋다.

그렇다면 이제 `GetNearbyDrivers` 에서 `getRepository()` 로 Data Mapper 방식을 사용하는 이유를 알 수 있다. 바로 사용자와 운전자가 데이터베이스 정보를 서로 독립적으로 교류하기 위해서다. 서로 각자 프로세스가 종료되더라도 데이터에 큰 영향을 받지 않는다. 물론 `Between()` 과 같은 Typeorm 에서 지원하는 함수를 사용하려면 Data Mapper 방식을 사용해야 한다.

----

## #1.66 DriversSubscription

여기서 부터는 사용자와 운전자간에 서로의 데이터가 오고 가도록 발행(Publish)과 구독(Subscription)을 설정할 것이다.

> **NOTE:**
> 
> ### **Publish & Subscription**
> 
> 정확히는 Publish–Subscribe Pattern 이라고 한다. 소프트웨어 아키텍처에서 Publish–Subscribe 은 Publisher(발행자 또는 게시자) 라는 메시지 발신자가 Subscriber(구독자 또는 가입자) 라고 하는 특정 수신자에게 메세지를 보내긴 하지만 직접 보내지는 않는다. Publisher 는 어떤 Subscriber 가 있는지 아는 바 없이 프로그래밍 된 메시지를 클래스로 분류하고 메세지를 보낸다.
> 
> 마찬가지로 구독자 또한 하나 이상의 클래스에 관심을 가질 수 있다. 그리고 어떤 발행자가 있는지에 대한 지식없이 관심있는 메시지만 수신하면 된다. Publish–Subscribe 은 Message Queue 개념에서 온 것이다. 그리고 일반적으로 하나의 거대한 Message-Oriented Middleware 시스템의 일부분이다.
> 
> 참고: https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern



#### app.ts
```typescript
...

import { GraphQLServer, PubSub } from "graphql-yoga";

...

class App {
  public app: GraphQLServer;
  public pubSub: any;
  constructor() {
    this.pubSub = new PubSub(); // Publish & Subscription(발행과 구독, graphql-yoga 자체 지원)
    this.pubSub.ee.setMaxListeners(99); // 개발용 listener
    this.app = new GraphQLServer({
      schema,
      context: req => {
        return {
          req: req.request,
          pubSub: this.pubSub, // context 로 공유된다.
        };
      },
    });
    this.middlewares();
  }

 ...

}
```

이제  `graphql-yoga` 가 지원하는 Publish & Subscription 기능인 `PubSub` 을 사용할 것이다. 그러나 이것은 데모로 만 사용하고 실제로 제품화 할 때는 [Redies](https://github.com/davidyaha/graphql-redis-subscriptions), Memcached 와 같은 것들을 써야한다.

`App` 클래스에서 `pubSub` 이라는 멤버 변수를 추가했다. 그리고 `this.pubSub` 은 `new` 연산자를 통해 `PubSub` 의 인스턴스를 가지고 있다. 다시 말해 `PubSub` 이라는 클래스가 있고 클래스 앞에 `new` 연산자를 사용하면 인스턴스가 생성된다는 뜻이다. `PubSub` 의 인스턴스인 `this.pubSub` 은 다시 `context` 객체를 통해 여러 Resolver 에게 전달된다. `this.pubSub.ee.setMaxListeners(99)` 는 이벤트 리스너 설정이다.

> **NOTE:** 
> 
> ### **Constructor**
> 
> 클래스에서 `constructor` 는 인스턴스를 생성하고 클래스 필드를 초기화하기 위한 특수한 메소드이다.
> 
> ### **클래스 필드(Class Field) & 멤버 변수**
>
> 클래스 내부의 캡슐화된 변수를 말한다. 데이터 멤버 또는 멤버 변수라고도 부른다. 클래스 필드는 인스턴스의 프로퍼티 또는 정적 프로퍼티가 될 수 있다. 쉽게 말해, 자바스크립트의 생성자 함수에서 `this` 에 추가한 프로퍼티를 클래스 기반 객체지향 언어에서는 클래스 필드라고 부른다.

#### DriversSubscription.graphql
```graphql
type Subscription {
  DriversSubscription: User
}
```

#### DriversSubscription.resolvers.ts
```typescript
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
```

이제 새로운 위치의 움직임이 전달되면 사용자 정보를 업데이트 해야 한다. 그것은 `ReportMovement.resolvers.ts` 에서 담당한다.

#### ReportMovement.resolvers.ts
```typescript
...

const resolvers: Resolvers = {
  Mutation: {
    ReportMovement: privateResolver(
      async (
        _,
        args: ReportMovementMutationArgs,
        { req, pubSub }, // #1 context 에 pubSub 연결
      ): Promise<ReportMovementResponse> => {
        const user: User = req.user;
        const notNull = cleanNullArgs(args);
        try {
          // #2 사용자 정보를 업데이트 할 때, 업데이트 된 사용자 정보를 다시 가져오고
          await User.update({ id: user.id }, { ...notNull });
          const updatedUser = await User.findOne({ id: user.id });
          // #3 구독자에게 전달한다. 여기선 Driver 가 Passenger 에게 전달한다.
          pubSub.publish("driverUpdate", { DriversSubscription: updatedUser });
          return {
            ok: true,
            error: null,
          };
        } catch (error) {
          return {
            ok: false,
            error: error.message,
          };
        }
      },
    ),
  },
};

...
```

- `context` 를 통해서 `{ req, pubSub }` 처럼 `PubSub` 의 인스턴스를 가져온다.
- `User.update( ... )` 를 통해 사용자 위치를 업데이트 하고
- `User.findeOne( ... )` 로 업데이트 한 정보를 다시 불러온다. 다시 불러와야 하는 이유는 `User.update()` 는 수정 요청만 보내고 존재여부는 신경쓰지 않기 때문에 수정된 `User` 를 반환해 주지 않는다.
- 그리고 그 업데이트 한 사용자 정보를 `"driverUpdate"` 라는 이벤트 리스너로 구독한 구독자들에게 전달한다. 데이터를 전달할 때 속성인 `DriversSubscription` 은 `DriversSubscription.graphql` 에서 정의된 Scheme 속성과 같아야 한다.

하지만 아직 문제가 더 남아 있다. Driver 인증은 어떻게 할 것인가? 그리고 어떤 사용자가 구독을 Listening 하는지 알 수 있을까? 이대로 한다면 불필요한 광범위한 거리의 구독자까지 갈 것이다. 그래서 Driver 근처에 있는 사용자에게만 발행되도록 해야 한다. 그렇다면 그러한 정보를 걸러내는 작업이 필요하다. 그것은 다음 과정에서 다룰 것이다.

테스트를 하기전에 `Subscription` 타입으로 `DriversSubscription` 을 설정한다. `DriversSubscription` 은 이벤트가 발생하면 `User` 데이터를 불러온다. 이벤트가 발생할 때 까지는 계속 Listening 상태다.

<img src="https://drive.google.com/uc?id=127tjuUUMJEBVzg_e2WGhAqPkMEUvw_Bp" alt="Driver Subscription Test 01" width="960">

다른 탭으로 `Mutation` 타입을 주고 `ReportMovement` 속성에서 `lat` 에 변화를 준다.

<img src="https://drive.google.com/uc?id=1dEwGCvo36dwCrvsiSWkpMcCVfa94kHmZ" alt="Driver Subscription Test 02" width="960">

어떤 Driver 한테서 변화가 생긴 것인지 구독한 측에 운전자 `fullName` 이 출력될 것이다.

<img src="https://drive.google.com/uc?id=1m6oA0tLq_uSQPMQekL2WYsxiGnzJI2_N" alt="Driver Subscription Test 03" width="960">

----

## #1.68 Authenticating WebSocket Subscriptions

이제 누가 구독하고 있는지 인증하는게 필요하다. 왜냐하면 누가 구독하고 있는지 알아야 나중에 Publishing(게시) 할 수 있다. 우리는 사용자간의 발행과 구독을 Web Socket 을 통해 인증할 것이다.

> **NOTE:**
>  
> ### **Web Socket**
>  
> WebSocket은 서버와 클라이언트 간에 Socket Connection을 유지해서 언제든 양방향 통신(Duplex) 또는 데이터 전송이 가능하도록 하는 기술을 말한다. 쉽게 말하면 웹버전의 TCP 또는 Socket (소켓)이다. WebSocket 을 제대로 알려면 Socket 이 무엇인지 알아야 한다.
> 
> 참고: [Web Socket 이란](http://utk-unm.blogspot.com/2016/10/websocket.html)
> 
> ### **Socket**
> 
> 네트워크에 연결된 모든 장치들을 노드(Node)라고 한다. 노드 중에서도 IP 주소를 가지고 있는 것을 호스트(Host)라 한다. 호스트는 스마트폰, 노트북 그리고 서버도 해당된다. 데이터는 호스트들 끼리 주고 받는 것이다.
> 
> 그러나 실제로 호스트를 찾아갔다고 해서 끝이 아니다. 데이터의 종점은 바로 호스트 안에 프로세스다. 흔히 프로세스는 프로그램, 애플리케이션, S/W 모두를 총칭한다. 애플리케이션 안에는 여러개의 프로세스가 존재한다. 그래서 네트워크 상의 데이터 종착점은 서로 다른 프로세스들이다. 다른말로 '데이터는 프로세스 레벨에서 주고 받는다'라고 말할 수 있다.
> 
> 데이터가 프로세스에 잘 도착하기 위해선 여러가지 과정을 거친다. 마냥 전달한다고 받는게 아니라 정해진 절차와 규칙이 존재한다. 그 규칙들 중에 우선 호스트를 찾아가는 IP 주소가 필요하다. 주소를 잘 찾아갔다면 이제 그 호스트에 어떤 프로세스로 가야하는지 알려주는 포트(Port) 번호가 필요하다. 포트는 호스트가 내부적으로 프로세스에게 할당한 고유 값이다. 고유 값이라는 점이 중요한데, 왜냐하면 호스트 내에서 프로세스를 식별하기 위해 사용되는 값이기 때문에 같은 호스트 내에서 **서로 다른 프로세스가 같은 포트 번호를 가질 수 없기 때문이다**.
> 
> 항해 경로를 따라 주소지 항구 도착하고 정박하면 외국인이 다음으로 찾아갈 곳은 바로 외국인 여권 심사 창구다. 여권 심사 창구에선 그가 누구고, 어디서 왔고, 어떤 주소지, 어떤 방법으로 프로세스로 갈건지 확인해야지만 창구 다음으로 넘어갈 수 있다는 뜻이다. 이 창구를 다른 말로 소켓이라고 하며 IP 주소, 포트, 프로토콜 이렇게 3가지로 정의되어야만 열린다. 창구는 여러개를 가질 수 있다. 이 말은 하나의 프로세스는 수십 수백개의 소켓(창구)을 가질 수 있다는 의미다. 여기서 여권의 역할(인증)을 하는 것이 바로 프로토콜의 Header 이다. 소켓은 네트워크 세계관인 OSI 7계층에서 전송계층(Transport Layer)에 해당한다. 그래서 소켓은 전송계층에서 사용하는 프로토콜이다. 대표적으로 TCP, UDP 가 있다.
> 
> 이제 Web Socket 이 무엇인지 감이 올 것이다. Web Socket 은 빠른 양방향 데이터 통신을 위해 브라우저 앱 안에서 웹 데이터가 오고가게 하는 창구인 것이다.
> 
> 참고: [소켓(Socket) 포트(Port) 뜻과 차이](http://blog.naver.com/PostView.nhn?blogId=myca11&logNo=221389847130&categoryNo=24&parentCategoryNo=0&viewDate=&currentPage=1&postListTopCurrentPage=1&from=postView)

`index.ts` 에서 우선 App Option 을 수정해야 한다.

```typescript
...

const SUBSCRIPTION_ENDPOINT: string = "/subscription";

const appOptions: Options = {
  port: PORT, // localhost:4000
  playground: PLAYGORUND_ENDPOINT, // graphql 테스트를 위한 endpoint
  endpoint: GRAPHQL_ENDPOINT, // graphql endpoint
  subscriptions: {
    path: SUBSCRIPTION_ENDPOINT,
    onConnect: async connectionParams => {
      const token = connectionParams["X-JWT"];
      if (token) {
        const user = await decodeJWT(token);
        if (user) {
          return {
            currentUser: user,
          };
        }
      }
      throw new Error("No JWT. 구독이 없습니다.");
    },
  },
};

...
```

- `graphql-yoga` 에선 `App` 옵션 몇가지를 커스터마이즈 할 수 있는 Subscription 을 지원한다.
- `string` 타입의 `SUBSCRIPTION_ENDPOINT` 변수에 `"/subscription"` 디렉토리 경로를 설정한다.
- 옵션 객체인 `appOptions` 에 `subscripions` 속성을 추가하고 그 경로를 값으로 추가한다.
- 그리고 `onConnect` 은 WebSocket 연결이 완료되면 실행할 비동기 함수다. 그런데 우리는 인증을 해야 한다. 인증을 해야할 부분이 바로 `onConnect` 이다. 그런데 `connectionParams` 는 어떤 정보가 있을까? 출력을 해보면 다음과 같다.
  <img src="https://drive.google.com/uc?id=1qplFltAD5i62cQgyJsYOyZjPwuE4SNLI" alt="onConnect Arguments Test" width="600">
- Token 이 출력되는데 바로 인증이라는 것을 알게된다. 이것을 Decode 하면 우리가 실제로 필요한 `currentUser` 라는 속성으로 사용자 정보를 전달하게 된다.


`app.ts` 에서 WebSocket 으로 들어온 정보를 `context` 속성을 통해 Resolver 들에게로 전달하는 역할을 한다.
```typescript

...

class App {
  public app: GraphQLServer;
  public pubSub: any;
  constructor() {
    this.pubSub = new PubSub(); // Publish & Subscription(게시와 예약, graphql-yoga 자체 지원)
    this.pubSub.ee.setMaxListeners(99); // 개발용 listener
    this.app = new GraphQLServer({
      schema,
      // 나중에 요청이 들어올 시 Callback 으로 전달할 Context, 모든 Resolvers 에서 사용가능
      context: req => {
        const { connection: { context = null } = {} } = req;
        return {
          req: req.request,
          pubSub: this.pubSub,
          context
        };
      },
    });
    this.middlewares();
  }

  ...

}
```

`context` 속성에 `req` 인자로 들어오는 객체가 무엇인지 `console.log(req);` 처럼 출력을 해본다면 우리가 무엇을 할 것인지 의도가 명확해진다.

<img src="https://drive.google.com/uc?id=1zu_BARSgHYWbar7HDZAYDug4qJ2KWbom" alt="Request Connection Context" width="560">

결국 `connection` 은 WebSocket 이라는 것을 알게된다. 그런데 `const { connection: { context = null } = {} } = req;` 은 난해해 보인다. 먼저 `const { connection: {...} } = req;` 는 `req.connection = {...}` 과 같다. 그런데 `connection` 이 없을 수 있는 경우를 생각해 빈 객체 `req.connection = {}` 를 Default 값으로 넣는다. 

여기에 `const { connection: { context: {...} } } = req;` 까지 붙으면 `req.connection.context = {...}` 이 된다. 그러나 `req.connection` 안에 `context` 가 없을 수 있다. 그래서 `req.connection.context = null` 과 같은 효과를 내기 위해 `{ context = null }` 을 Default 값으로 넣은 것이다.

결국 `context = null`, `connection = {}` 은 Default 값을 준 것이다. 이와 같은 방법을 Destructuring(비구조화, 파괴)이라고 한다.

> **NOTE:** 
> 
> ### **Destructuring**
> 
> 디스트럭처링(Destructuring)은 구조화된 배열 또는 객체를 Destructuring(비구조화, 파괴)하여 개별적인 변수에 할당하는 것이다. 배열 또는 객체 리터럴에서 필요한 값만을 추출하여 변수에 할당하거나 반환할 때 유용하다.
> 
> 참고: [디스트럭처링(Destructuring)](https://poiemaweb.com/es6-destructuring)


----

## #1.70 Filtering Subscription Messages

사용자의 상태에 따라 게시(Publish)를 달리해야 한다. 그러기 위해 `graphql-yoga` 에 내장된 `withFilter()` 함수를 사용할 것이다. `withFilter()` 는 해당 예약을 통해 필요한 정보만 필터해 가공한다. 그리고 전달 여부를 `true`, `false` 로 반환한다.

#### DriversSubscription.resolvers.ts
```typescript
import { withFilter } from "graphql-yoga";

const resolvers = {
  Subscription: {
    DriversSubscription: {
      subscribe: withFilter(
        (_, __, { pubSub }) => pubSub.asyncIterator("driverUpdate"),
        (payload, _, { context }) => {
          console.log(`ReportMovement Resolver 로 부터 온 정보:`, payload);
          console.log(`Listening`, context);
          return true; // true, false 냐에 따라 Subscription 을 전달하거나 안할 수 있다.
        },
      ),
    },
  },
};

export default resolvers;
```

`payload`, `context` 를 출력해본 결과는 다음과 같다.

<img src="https://drive.google.com/uc?id=1qpfMHJOAqsBXhf7fNvwplZKtWu3nNGH6" alt="Driver Subscription Console.log Result" width="560">

- `payload` 는 `ReportMovement` 로 부터 채널인 `"driverUpdate"` 가 작동하면서 운전자 위치 데이터가 들어온다.
- `context` 는 구독한 탑승자 위치 데이터이다(단, 현재 테스트 단계에선 운전자와 탑승자 정보가 동일하다).
- 이 두개의 정보를 활용해 `DriverSubscription` 구독자는 자신과 운전자의 위치가 근처에 있는지 여부를 판단하도록 할 것이다.

```typescript
import { withFilter } from "graphql-yoga";
import User from "../../../entities/User";

const resolvers = {
  Subscription: {
    DriversSubscription: {
      subscribe: withFilter(
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
          // 운전자, 탑승자의 근접 위치를 비교해
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
```

- `withFilter()` 함수는 첫번째 인자로 구독을 받는다. 그리고 그 구독은 `asyncIterator` 함수를 사용한다. 두번째 인자는 필터 함수다. 실제로는 사용자에게 근처에 운전자가 있는지 여부를 전달한다. 자세히 보면 운전자, 사용자의 근접 위치를 비교해, 위도, 경도 상하좌우로 0.05 씩 직사각형 범위에 있는지 여부를 판단해 `true`, `false` 를 반환한다.
- 자세히 보면 예약하는 쪽에선 Resolvers Type 을 정의하지 않았다. 여기서는 `Mutation` 이 아니고 `Subscription` 이기 때문에 하면 안된다.

일단 새로운 `User`를 운전자로 만들어 테스트 해보자.

<img src="https://drive.google.com/uc?id=1IoD8yvvv73K9PZAd28ih8M3vjcAitu0h" alt="Driver Subscription Test 01" width="960">

운전자 모드로 바꾸고

<img src="https://drive.google.com/uc?id=1GR7PP_XxH8DYTnq1Vej0TLIoz--VFMcP" alt="Driver Subscription Test 02" width="960">

새로운 위치를 만들고

<img src="https://drive.google.com/uc?id=1o0SHPLpU6jlg1XoMXQ-SHmesgGy_scOo" alt="Driver Subscription Test 03" width="960">

위치를 다시 0.05 차이로 갱신한다.

<img src="https://drive.google.com/uc?id=1QzZIlrej0GYZSyC2gQrUfsM1sJHOjFLM" alt="Driver Subscription Test 04" width="960">

0.05 내외로 차이나는 것일 경우만 `DriversSubscription` 이 작동한다.

<img src="https://drive.google.com/uc?id=1z-Nv7GDp_1Xym9n8KYcwX77RcOfQB3qq" alt="Driver Subscription Test 05" width="960">

만일 `lastLat`, `lastLng` 각각 0.05 를 훨씬 벗어나는 값으로 작동시키면 다음과 같이 반응이 없다.

----

## #1.72 RequestRide Resolver

예를들어 승객이 운전자에게 탑승 할려면 우선 탑승 요청을 해야 할 것이다. 그리고 탑승은 운전자로써 탑승인지 승객으로써 탑승인지 여부에 따라 달라질 것이다. 이전에 User Entity 에서 `isDriving`, `isRiding` 을 설정했다. 바로 이것으로 나중에 누가 탑승한 것인지 판별할 것이다.

#### RequestRide.graphql
```graphql
type RequestRideResponse {
  ok: Boolean!
  error: String
  ride: Ride
}

type Mutation {
  RequestRide(
    pickUpAddress: String!
    pickUpLat: Float!
    pickUpLng: Float!
    dropOffAddress: String!
    dropOffLat: Float!
    dropOffLng: Float!
    price: Float!
    distance: String!
    duration: String!
  ): RequestRideResponse!
}
```

우선 `Ride.ts` 에서 수정해야 할 부분이 있다.

```typescript
...

@Entity()
class Ride extends BaseEntity {
  @PrimaryGeneratedColumn() id: number;

  @Column({
    type: "text",
    enum: ["ACCEPTED", "FINISHED", "CANCELED", "REQUESTING", "ONROUTE"],
    default: "REQUESTING",
  })
  status: rideStatus;

  ...

  // 다수의 Ride(승객)는 한명의 User(passenger, driver)를 갖는다.
  @ManyToOne(type => User, user => user.ridesAsPassenger)
  passenger: User;
  // Ride 를 요청할 시에는 아직 Driver 가 할당되지 않은 상태기 때문에 nullable 을 설정한다.
  @ManyToOne(type => User, user => user.ridesAsDriver, { nullable: true })
  driver: User;

  @CreateDateColumn() createdAt: string;
  @UpdateDateColumn() updatedAt: string;
}

...
```

두번째 `@ManyToOne` 에서 `{ nullable: true }` 를 한 이유는 탑승 요청시에는 아직 운전자가 할당되지 않은 상태일 것이기 때문이다. 그렇다면 첫번째 `@ManyToOne` 에서 `passenger` 는 그런 설정이 없는 이유는 무엇일까? 승객은 항상 있을 것이기 때문에 `nullable` 을 안해도 되는 것이다.

#### RequestRide.resolvers.ts
```typescript
import Ride from "../../../entities/Ride";
import User from "../../../entities/User";
import {
  RequestRideMutationArgs,
  RequestRideResponse,
} from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
  Mutation: {
    RequestRide: privateResolver(
      async (
        _,
        args: RequestRideMutationArgs,
        { req },
      ): Promise<RequestRideResponse> => {
        const user: User = req.user;
        try {
          const ride = await Ride.create({ ...args, passenger: user }).save();
          return {
            ok: true,
            error: null,
            ride,
          };
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
```

`RequestRide` Resolver 는 간단하다. 탑승 요청시 새로운 탑승자를 만들고 그 사용자 정보를 DB 에 저장한다.

----

## #1.73 GetNearbyRide Resolver

운전자는 앱을 처음으로 실행하면 주변에 탑승자들 여부를 알아야 한다. 그래서 운전자가 주변에 탑승자들이 있는지 여부를 요청하는 함수를 만들어야 한다. `GetNearbyRide` 구성은 다음과 같다.

#### GetNearbyRide.graphql
```graphql
type GetNearbyRideResponse {
  ok: Boolean!
  error: String
  rides: [Ride]
}

type Query {
  GetNearbyRide: GetNearbyRideResponse!
}
```

#### GetNearbyRide.resolvers.ts
```typescript
import { Between, getRepository } from "typeorm";
import Ride from "../../../entities/Ride";
import User from "../../../entities/User";
import { GetNearbyRideResponse } from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
  Query: {
    GetNearbyRide: privateResolver(
      async (_, __, { req }): Promise<GetNearbyRideResponse> => {
        const user: User = req.user;
        if (user.isDriving) {
          const { lastLat, lastLng } = user;
          try {
            const ride = await getRepository(Ride).findOne({
              status: "REQUESTING",
              pickUpLat: Between(lastLat - 0.05, lastLat + 0.05),
              pickUpLng: Between(lastLng - 0.05, lastLng + 0.05),
            });
            if (ride) {
              return {
                ok: true,
                error: null,
                ride,
              };
            } else {
              return {
                ok: true,
                error: null,
                ride: null
              }
            }
          } catch (error) {
            return {
              ok: false,
              error: error.message,
              ride: null,
            };
          }
        } else {
          return {
            ok: false,
            error: "당신은 운전자가 아닙니다.",
            ride: null,
          };
        }
      },
    ),
  },
};

export default resolvers;
```

- `Between()` 함수를 사용하기 위해 `getRepository()` 로 `Ride` 를 찾는다.
- 찾을 때는 탑승 요청이 있는 `"REQUESTING"` 인 경우, 그리고 픽업이 가능한 좌표 근처를 `Between` 함수를 이용한다.

----

## #1.74 NearbyRideSubscription

운전자는 주변에 승객들에게 탑승 요청을 받아야 한다. 운전자가 픽업 가능한 구역에서 탑승 요청을 받는 `NearbyRideSubscription` 을 구현해 보자.

#### NearbyRideSubscription.graphql
```graphql
type Subscription {
  NearbyRideSubscription: Ride
}
```

#### NearbyRideSubscription.resolvers.ts
```typescript
import { withFilter } from "graphql-yoga";
import User from "../../../entities/User";

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
```

`RequestRide` 의 역할은 탑승 가능한 주변 승객들의 정보를 구독한 측으로 보낸다. 즉, 운전자에게 주변 승객 정보를 전달한다. 그렇다면 `RequestRide` 는 발행하는 쪽이고 운전자 측이 구독한 측이 될 것이다. `NearbyRideSubsciption` 은 그 정보를 받는데 모든 정보를 받지 않고 운전자가 픽업이 가능한 지역의 정보만 걸러낸다. `RequestRide.resolvers.ts` 에서 `rideRequest` 로 Listening 하고 보낼 승객 데이터를 연결한다.

#### RequestRide.resolvers.ts
```typescript
...

const resolvers: Resolvers = {
  Mutation: {
    RequestRide: privateResolver(
      async (
        _,
        args: RequestRideMutationArgs,
        { req, pubSub },
      ): Promise<RequestRideResponse> => {
        const user: User = req.user;
        // 사용자가 탑승중이 아닌 경우에만 탑승이 가능하도록, 중복 탑승은 없다.
        if (!user.isRiding || !user.isDriving) {
          try {
            const ride = await Ride.create({ ...args, passenger: user }).save();
            pubSub.publish("rideRequest", { NearbyRideSubscription: ride });
            user.isRiding = true; // 사용자가 탑승 중임을 기억
            user.save();
            return {
              ok: true,
              error: null,
              ride,
            };
          } catch (error) {
            return {
              ok: false,
              error: error.message,
              ride: null,
            };
          }
        } else {
          return {
            ok: false,
            error: "중복 탑승 요청은 할 수 없습니다.",
            ride: null,
          };
        }
      },
    ),
  },
};

...
```

이렇게 탑승 요청은 구독한 측으로 탑승자 정보를 전달하고 또 다른 측인 운전자는 탑승자의 위치가 주변에 있는지 여부를 알게 된다.

----

## #1.75 Testing the NearbyRideSubscription

`NearbyRideSubscription` 속성으로 주변 가까운 승객들을 `id` 로 찾는다. `NearbyRideSubscription` 는 운전자 측이다. Play 버튼을 누르면 Listening... 상태가 된다. 즉, 이벤트가 발생하길 기다리고 있다.

<img src="https://drive.google.com/uc?id=16g0IkyqJnDTdjmz6F7RL-LfO-qxmwK_h" alt="Nearby Ride Subscription 01" width="960">

`RequestRide` 는 사용자(승객) 측이다. 사용자 측에서 픽업 장소나 드롭 장소 등의 정보를 전달한다.

<img src="https://drive.google.com/uc?id=1tumconDE9i7Y1f-jQQX0IO9tungsCp1i" alt="Nearby Ride Subscription 02" width="960">

`NearbyRideSubscription` 로 다시 돌아오면 주변에 탑승 요청이 들어온 것을 이벤트가 감지하고 운전자에게 승객 `id` 를 출력한다. 

<img src="https://drive.google.com/uc?id=1BMG8YjtGUiHKVWMmnHByWLNGdr6P45zr" alt="Nearby Ride Subscription 03" width="960">

요청을 받고 탑승을 했다면 `isRiding = true` 가 될 것이다. 그래서 중복 탑승이 되지 않고 탑승 요청을 할 수 없다.

----

## #1.76 UpdateRideStatus Resolver

이제 운전자로서 탑승 요청을 한다면 탑승 상태를 바꿀 Resolver 를 작성해보자.

```graphql
type UpdateRideStatusResponse {
  ok: Boolean!
  error: String
}

enum StatusOptions {
  ACCEPTED
  FINISHED
  CANCELED
  REQUESTING
  ONROUTE
}

type Mutation {
  UpdateRideStatus(
    rideId: Int!
    status: StatusOptions!
  ): UpdateRideStatusResponse!
}
```

`UpdateRideStatus` 는 열거형(`enum`) Type 인 `StatusOptions` 을 가지고 있다. 상태에 따라 업데이트 옵션을 변경할 것인데, 수락(`ACCEPTED`), 완료(`FINISHED`), 취소(`CANCELED`), 요청중(`REQUESTING`), 가는중(`ONROUTE`) 등의 상태가 있다. 이 옵션들은 이미 Ride Entity 가 있는 `Ride.ts` 에 정의해논 것들이다. 그외 다른 것들을 넣으면 작동하지 않는다.

> **NOTE:**
> 
> ### **열거형(Enumerated Type)**
> 
> Enum은 열거형이라고 불리며, 서로 연관된 상수들의 집합을 의미한다.

`src/types/graph.d.ts` 를 살펴보면 열거형은 다음과 같이 변형된 것을 확인할 수 있다.

```typescript
export type StatusOptions = "ACCEPTED" | "FINISHED" | "CANCELED" | "REQUESTING" | "ONROUTE";
```

#### UpdateRideStatus.resolvers.ts
```typescript
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
        // 사용자가 Driver 인 경우, 운전자(Driver)가 탑승한(Ride) 경우와 승객(Passenger)이 탑승한 경우를 따져야 함
        if (user.isDriving) {
          try {
            let ride: Ride | undefined;
            // Driver 가 탑승을 승인(ACCEPTED)할 경우
            if (args.status === "ACCEPTED") {
              ride = await Ride.findOne({
                id: args.rideId,
                status: "REQUESTING", // 중복 수락이 되지 않도록 요청중인 상태로 변경해야 한다.
              });
              if (ride) {
                // 탑승 사용자는 운전자로서 결정되고 저장된다.
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
            // 이제 탑승 상태 변경이 들어오면
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
```

- `UpdateRideStatus` 라는 요청이 들어오면 수락, 취소, 종료 등 상태로 변경할 수 있다. 먼저 `if (user.isDriving)` 처럼 운전자로서 탑승 요청을 받을 경우 상태를 변경하는 조건을 만난다. 그외는 승객이기 때문에 "당신은 운전자가 아닙니다." 라는 메세지를 보낸다.
- 운전자로서 `if (args.status === "ACCEPTED")` 처럼 수락 요청을 받았다면 중복 수락을 피하기 위해 탑승 상태 또한 `"REQUESTING"` 으로 변경해야 한다. 그리고 그외 상태 경우는 이미 수락을 받고 운행중인 경우기 때문에 현재 운전자를 전달한다.
- 운전자로서 수락된 경우 `if (ride)` 조건 안으로 탑승 요청자가 운전자로서 결정되었다는 것을 `user.isTaken = true` 처럼 DB에 저장한다.
- 이제 운전자로서 탑숭이 수락된 이후는 이외 상태들은 완료(`FINISHED`), 취소(`CANCELED`), 가는중(`ONROUTE`) 일 것이다. 운전자의 나머지 탑승 상태들은 `if (ride)` 를 거쳐 `ride.status = args.status` 처럼 변경될 것이다.

----

## #1.78 GetRide Resolver

#### GetRide.graphql
```graphql
type GetRideResponse {
  ok: Boolean!
  error: String
  ride: Ride
}

type Query {
  GetRide(rideId: Int!): GetRideResponse!
}
```

#### GetRide.resolvers.ts
```typescript
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
              error: "탑승자를 찾을 수 없습니다.",
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
```

- `GetRide` 로 사용자가 Driver 인지 아니면 Passenger 인지 여부를 판단해 넘겨줘야 한다. 우선 인자로 받은 `args.rideId` 를 Ride Entity 에서 조회한다.
- `if (ride)` 로 조회된 것이 확인되면 그 사용자가 누구인지 `if (ride.passengerId === user.id || ride.driverId === user.id)` 처럼 판단한다. 여기서 다음과 같이 관계 연산을 통해 `ride.passenger.id` 나 `ride.driver.id` 처럼 할 수도 있지만 이것은 데이터베이스 부분에서 처리하기에 무거워진다. 우리는 다른 방법인 `ride.passengerId`, `ride.driverId` 속성을 따로 만들어 사용자를 찾는다.
  ```typescript
  ...
  try {
    const ride = await Ride.findOne({
      id: args.rideId,
      { relations: ["passenger", "driver"] }
    });
    if (ride) {
      if (ride.passenger.id === user.id || ride.driver.id === user.id) {
        ...
      }
    }
  } catch(error) {
    ...
  }
  ```
- 해당 `id` 가 어느 누구도 아니라면 인증된 사용자가 아니거나 탑승을 하지 않은 사용자다.

#### Ride.ts
```typescript
@Entity()
class Ride extends BaseEntity {
  @PrimaryGeneratedColumn() id: number;

  @Column({
    type: "text",
    enum: ["ACCEPTED", "FINISHED", "CANCELED", "REQUESTING", "ONROUTE"],
    default: "REQUESTING",
  })
  status: rideStatus;

  ...

  @Column({ nullable: true })
  passengerId: number;

  @Column({ nullable: true })
  driverId: number;

  // 다수의 Ride(승객)는 한명의 User(passenger, driver)를 갖는다.
  @ManyToOne(type => User, user => user.ridesAsPassenger)
  passenger: User;

  ...

}
```

위에서 `ride.passengerId`, `ride.driverId` 속성을 사용했는데 `Ride.ts` 에도 그에 맞는 속성을 추가해야 한다. 그리고 다음과 같이 `passengerId` 나 `driverId` 처럼 설정하면 Typeorm 이 자동으로 데이터베이스를 보지 않고도 `id`를 붙여서 반환해 준다.

#### Ride.graphql
```graphql
type Ride {
  id: Int!
  status: String!
  pickUpAddress: String!
  pickUpLat: Float!
  pickUpLng: Float!
  dropOffAddress: String!
  dropOffLat: Float!
  dropOffLng: Float!
  price: Float!
  distance: String!
  duration: String!
  driver: User!
  driverId: Int # 추가된 부분
  passenger: User!
  passengerId: Int! # 추가된 부분
  createdAt: String!
  updatedAt: String
}
```

`passengerId` 는 필수지만 `driverId` 는 없을 때도 있으니 필수가 아니다. 테스트 한 결과는 다음과 같이 나온다.

<img src="https://drive.google.com/uc?id=1lVKwBy37xTsDU3VdlIwfVu_-wsxMykCx" alt="Get Ride Result"  width="960">

----

## #1.79 RideStatusSubscription

앞서 만든 `UpdateRideStatus` 를 테스트 해보자. `RequestRide` 의 JWT Header 를 그대로 가져와 다음과 같이 실행한다. 참고로 `RequestRide` 는 승객 측에서 요청한다.

<img src="https://drive.google.com/uc?id=1-siKr4pOcwD76xWueGXTu3bBC8ujxPLJ" alt="UpdateRideStatus Test 01" width="960">

결과는 "당신은 운전자가 아닙니다." 라는 결과로 출력된다. 왜 "당신은 운전자가 아닙니다." 라고 나온 것일까? 결과적으로 이 `UpdateRideStatus` 는 승객 측 사용자가 탑승 상태를 변경한 것이다. 자세히 보면 `rideId: 2` 는 운전자의 식별자이다. 그런데 JWT Header 는 승객 측의 것이고 탑승 상태 변경을 요청한 것이기 때문에 상태를 변경할 수 없다고 나온다. 흥미롭게도 `rideId` 는 운전자로 등록되어있는 식별자인데 JWT Header 는 승객의 것이다.

<img src="https://drive.google.com/uc?id=1UoHWgiwtOMsWjEIOq3IhbdZUa4LGmcKw" alt="UpdateRideStatus Test 02" width="960">

그래서 승객의 JWT Header 가 아니라 운전자의 JWT Header 로 변경해 다시 상태 변경 요청을 해보자. 그러니 정상적으로 변경되었다고 출력된다. 최종적으로 `GetRide` 로 운전자 측 사용자가 제대로 적용되었는지 확인한다.

<img src="https://drive.google.com/uc?id=18DYviADYhEUTMQkWOkQ8spgVvv38ZKXq" alt="UpdateRideStatus Test 03" width="960">

테스트 결과는 다음과 같은 사실을 알려준다.
- `UpdateRideStatus` 는 운전자나 승객 모두 탑승 상태를 변경하는데 요청이 들어올 수 있다.
- 사용자는 운전자나 승객이 될 수 있다. 그래서 `rideId` 가 같을 수 있다. 그러나 어떤 JWT Header 냐에 따라 운전자인지 승객인지 구분된다.
- 우리가 작성한 `UpdateRideStatus` 는 잘 작동하고 있으며 운전자인지 승객인지를 식별해 운전자에게만 데이터 상태 변경을 개별적으로 전달한다.

이제 우리는 Ride Status 를 받아보기 위한 Subscription 을 작성해보자.

#### RideStatusSubscription.graphql
```graphql
type Subscription {
  RideStatusSubscription: Ride
}
```

#### RideStatusSubscription.resolvers.ts
```typescript
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
```

`payload` 는 `RideStatusSubscription.graphql` 에서 Subscription Type 으로 정의된 `RideStatusSubscription: Ride` 속성을 알고 있다. 결국 `Ride` 를 가져오면 거기에 `driverId`, `passengerId` 가 담겨져 있을 것이다.

#### UpdateRideStatus.resolvers.ts
```typescript
...

const resolvers: Resolvers = {
  Mutation: {
    UpdateRideStatus: privateResolver(
      async (
        _,
        args: UpdateRideStatusMutationArgs,
        { req, pubSub },
      ): Promise<UpdateRideStatusResponse> => {
        const user: User = req.user;
        if (user.isDriving) {
          try {
            let ride: Ride | undefined;
            if (args.status === "ACCEPTED") {
              ...
            } else {
              ...
            }
            if (ride) {
              ride.status = args.status;
              ride.save();
              // # rideUpdate 리스너 추가
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
            ...
          }
        } else {
          ...
        }
      },
    ),
  },
};

...
```

이제 테스트를 해보자. `RideStatusSubscription` 탭을 새로 만들고 Listening 을 걸어둔다.

<img src="https://drive.google.com/uc?id=1jRZ1fNtjjbZdooouKs3PwC2myNqJAiC2" alt="Test RideStatusSubscription 01" width="960">

`UpdateRideStatus` 탭에서 `status` 인자를 `CANCELED` 로 변경해 실행한다.

<img src="https://drive.google.com/uc?id=1YhvfZCv3pMxqEDpZwEAVeTslTgG_LBp4" alt="Test RideStatusSubscription 02" width="960">

`RideStatusSubscription` 탭에서 변경된 `CANCELED` 결과가 바로 나온 것을 볼 수 있다.

<img src="https://drive.google.com/uc?id=1-ET7A7llithRwYWL7n_QcKa0ydl7mLOD" alt="Test RideStatusSubscription 03" width="960">

----

## #1.81 Creating a ChatRoom

채팅방을 만들기 전에 먼저 앞서 만들었던 코드에서 수정해야 할 것들이 있다. 우선 `src/entities/Chat.ts` 를 수정해야 한다.

#### Chat.ts
```typescript
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne, // # 추가된 부분
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import Message from "./Message";
import User from "./User";

@Entity()
class Chat extends BaseEntity {
  @PrimaryGeneratedColumn() id: number;

  @OneToMany(type => Message, message => message.chat)
  messages: Message[];

  // # 수정된 부분
  @Column({ nullable: true })
  passengerId: number;

  // 다수의 Chat은 하나의 User(Passenger, Driver)를 가진다.
  @ManyToOne(type => User, user => user.chatsAsPassenger)
  passenger: User;

  @Column({ nullable: true })
  driverId: number;

  @ManyToOne(type => User, user => user.chatsAsDriver)
  driver: User;
  // # 여기까지 수정/추가됨

  @CreateDateColumn() createdAt: string;

  @UpdateDateColumn() updatedAt: string;
}

export default Chat;
```

채팅방안에는 각각 승객이나 드라이버로서 채팅을 하는 사용자가 존재할 것이다. 그 개별적인 사용자들은 각각 `id` 로 식별하기 위해 `passengerId`, `driverId` 를 부여했다. 다음은 `src/entities/User.ts` 를 수정해야 한다.

#### User.ts
```typescript
...

@Entity()
class User extends BaseEntity {

  ...

  @Column({ type: "text", nullable: true })
  fbID: string;

  // # 수정된 부분
  // 한명의 User는 다수의 Chat 상대(passenger, driver)가 있다.
  @OneToMany(type => Chat, chat => chat.passenger)
  chatsAsPassenger: Chat[];

  @OneToMany(type => Chat, chat => chat.driver)
  chatsAsDriver: Chat[];
  // # 여기까지 수정/추가됨

  @OneToMany(type => Message, message => message.user)
  messages: Message[];

  ...
  
}

...
```

`User.ts` 에서는 `@OneToMany` 로 한명의 사용자가 다수의 `Chat` 상대를 가질 수 있게 한다. 대화상대가 운전자이거나 승객일 수 있다. 지금까지 이렇게 수정한 이유는 새로운 채팅방을 만들고 `Chat` 에 사용자를 추가하기에 더 좋기 때문이다. 마지막으로 `User.graphql`, `Chat.graphql` 도 수정해줘야 한다.

#### User.graphql
```graphql
type User {
  ...

  fbID: String
  chatsAsPassenger: [Chat] # 수정
  chatsAsDriver: [Chat] # 수정
  messages: [Message]

  ...
}

...
```

#### Chat.graphql
```graphql
type Chat {
  id: Int!
  messages: [Message]
  passengerId: Int # 수정
  passenger: User # 수정
  driverId: Int # 수정
  driver: User # 수정
  createdAt: String!
  updatedAt: String
}
```

이제 본격적으로 채팅방을 만들기 전에 언제 채팅방을 만들어야 할까? 바로 운전자가 Ride 를 수락했을 때 만든다.

```typescript
import Chat from "../../../entities/Chat";

...

const resolvers: Resolvers = {
  Mutation: {
    UpdateRideStatus: privateResolver(
      async (
        _,
        args: UpdateRideStatusMutationArgs,
        { req, pubSub },
      ): Promise<UpdateRideStatusResponse> => {
        const user: User = req.user;
        if (user.isDriving) {
          try {
            let ride: Ride | undefined;
            if (args.status === "ACCEPTED") {
              ride = await Ride.findOne(
                {
                  id: args.rideId,
                  status: "REQUESTING",
                },
                { relations: ["passenger"] }, // 승객과의 채팅을 위해 passenger 관계 설정을 해준다.
              );
              if (ride) {
                ride.driver = user;
                user.isTaken = true;
                user.save();
                // 운전자가 탑승을 수락했기 때문에 새로운 채팅방이 생성된다.
                await Chat.create({
                  driver: user,
                  passenger: ride.passenger,
                }).save();
              }
            
            ...

        }
      },
    ),
  },
};

export default resolvers;
```

----

## #1.82 GetChat Resolver

#### GetChat.graphql
```graphql
type GetChatResponse{
  ok: Boolean,
  error: String,
  chat: Chat
}

type Query {
  GetChat(chatId: Int!): GetChatResponse!
}
```

#### GetChat.resolvers.ts
```typescript
import Chat from "../../../entities/Chat";
import User from "../../../entities/User";
import { GetChatQueryArgs, GetChatResponse } from "../../../types/graph";
import { Resolvers } from "../../../types/resolvers";
import privateResolver from "../../../utils/privateResolver";

const resolvers: Resolvers = {
  Query: {
    GetChat: privateResolver(
      async (_, args: GetChatQueryArgs, { req }): Promise<GetChatResponse> => {
        const user: User = req.user;
        try {
          const chat = await Chat.findOne({
            id: args.chatId,
          });
          if (chat) {
            if (chat.passengerId === user.id || chat.driverId === user.id) {
              return {
                ok: true,
                error: null,
                chat,
              };
            } else {
              return {
                ok: false,
                error: "인증되지 않은 채팅방입니다.",
                chat: null,
              };
            }
          } else {
            return {
              ok: false,
              error: "Not found.",
              chat: null,
            };
          }
        } catch (error) {
          return {
            ok: false,
            error: error.message,
            chat: null,
          };
        }
      },
    ),
  },
};

export default resolvers;
```

채팅방에 어떤 탑승자가 있는지 확인해야 한다. 그런데 우리는 Chat 과 Ride 간에 관계를 설정하지 않았다. 관계를 설정해야 어느 채팅방에 속해있는지 알 수 있다. 그리고 채팅방과 사용자는 1 대 1 관계이다. 그래서 @OneToOne 으로 관계를 만든다.



그리고 처음부터 Ride 에는 Chat 이 없으니 { nullable: true } 로 설정한다. 결국 Ride 상태가 REQUESTING 상태라면 Chat 이 없는 것이 정상이다.

그리고 Chat 만들 때에는 Ride 에 chat 을 포함시키자.


UpdateRideStatus 에서 생성된 채팅방을 ride 와 연결시킨다. 이제 탑승자는 자신이 어느 채팅방에 있는지 안다.

```graphql
type Chat {
  id: Int!
  messages: [Message]
  passengerId: Int!
  passenger: User!
  driverId: Int!
  driver: User!
  ride: Ride! # 추가된 부분
  createdAt: String!
  updatedAt: String
}
```

```graphql
type Ride {
  id: Int!
  status: String!
  pickUpAddress: String!
  pickUpLat: Float!
  pickUpLng: Float!
  dropOffAddress: String!
  dropOffLat: Float!
  dropOffLng: Float!
  price: Float!
  distance: String!
  duration: String!
  driver: User!
  driverId: Int
  passenger: User!
  passengerId: Int!
  chat: Chat! # 추가된 부분
  createdAt: String!
  updatedAt: String
}
```