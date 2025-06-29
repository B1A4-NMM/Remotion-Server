import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTodoAndEmotionTargetFields1751175013507 implements MigrationInterface {
    name = 'AddTodoAndEmotionTargetFields1751175013507'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`todo\` (\`id\` int NOT NULL AUTO_INCREMENT, \`content\` varchar(255) NOT NULL, \`isCompleted\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`emotion_target\` ADD \`emotion_intensity\` float NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`emotion_target\` ADD \`mentions\` int NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE \`todo\` ADD CONSTRAINT \`FK_9cb7989853c4cb7fe427db4b260\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`todo\` DROP FOREIGN KEY \`FK_9cb7989853c4cb7fe427db4b260\``);
        await queryRunner.query(`ALTER TABLE \`emotion_target\` DROP COLUMN \`mentions\``);
        await queryRunner.query(`ALTER TABLE \`emotion_target\` DROP COLUMN \`emotion_intensity\``);
        await queryRunner.query(`DROP TABLE \`todo\``);
    }

}
