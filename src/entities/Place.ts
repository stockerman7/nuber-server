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

	// typeorm 에서는 특정 관계를 이용해 간단히 id 를 로드하는 기능(@RelationId)이 있다.
	// https://github.com/typeorm/typeorm/blob/master/docs/decorator-reference.md#relationid
	@Column({ nullable: true })
	userId: number;

	@ManyToOne(type => User, user => user.places)
	user: User;

	@CreateDateColumn() createdAt: string;

	@UpdateDateColumn() updatedAt: string;
}

export default Place;
