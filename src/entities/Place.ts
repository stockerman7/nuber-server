import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import User from "./User";

@Entity()
class Place extends BaseEntity {
	@PrimaryGeneratedColumn() id: number;

	@Column({ type: "text" })
	name: string;

	@Column({ type: "double precision", default: 0 })
	lat: number;

	@Column({ type: "double precision", default: 0 })
	lng: number;

	@Column({ type: "text" })
	address: string;

	@Column({ type: "boolean", default: false })
	isFav: boolean;

	// typeorm 에서는 특정 관계를 이용해 간단히 전체 속성을 로드하는 기능을 가지고 있다. -> @RelationId
	// https://github.com/typeorm/typeorm/blob/master/docs/decorator-reference.md#relationid
	// 여기서는 전체 속성을 로드하지 않을 것이기 때문에 다음과 같이 작성한다.
	@Column({ nullable: true })
	userId: number;

	@ManyToOne(type => User, user => user.places)
	user: User;

	@CreateDateColumn() createdAt: string;

	@UpdateDateColumn() updatedAt: string;
}

export default Place;
