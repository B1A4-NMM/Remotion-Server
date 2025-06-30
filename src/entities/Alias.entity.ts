
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Target } from './Target.entity';


@Entity()
export class Alias {

    @PrimaryGeneratedColumn()
    id! : number;

    @Column()
    name! : string;

    @ManyToOne(() => Target, (target) => target.aliases)
    @JoinColumn({ name: 'target_id' })
    Target! : Target;


}