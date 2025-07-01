import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1751097363041 implements MigrationInterface {
    name = 'InitSchema1751097363041'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`user_share_group\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NULL, \`group_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`share_group\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`alias\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`target_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`emotion\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` enum ('행복', '기쁨', '신남', '설렘', '유대', '신뢰', '친밀', '그리움', '자신감', '서운', '평온', '안정', '편안', '소외', '불안', '실망', '기대', '속상', '상처', '감사', '무난', '차분', '긴장', '화남', '짜증', '무기력', '지침', '지루', '억울', '외로움', '우울', '공허', '초조', '부담', '어색', '불편', '단절') NOT NULL DEFAULT '행복', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`emotion_target\` (\`id\` int NOT NULL AUTO_INCREMENT, \`emotion_id\` int NULL, \`target_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`target\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`count\` int NOT NULL DEFAULT '0', \`recent_date\` date NULL, \`relation\` enum ('FAMILY', 'FRIEND', 'LOVER', 'PET', 'COLLEAGUE', 'STRANGER', 'ETC') NOT NULL DEFAULT 'ETC', \`type\` enum ('PERSON', 'PET', 'PLACE') NOT NULL DEFAULT 'PERSON', \`affection\` float NOT NULL DEFAULT '0', \`member_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        // await queryRunner.query(`CREATE TABLE \`diary_emotion_target\` (\`id\` int NOT NULL AUTO_INCREMENT, \`diary_id\` int NULL, \`target_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`diary\` (\`id\` int NOT NULL AUTO_INCREMENT, \`create_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`written_date\` datetime NOT NULL, \`content\` text NOT NULL, \`title\` varchar(255) NOT NULL, \`weather\` enum ('SUNNY', 'CLOUDY', 'RAINY', 'SNOWY', 'STORMY', 'WINDY') NOT NULL DEFAULT 'SUNNY', \`photo_path\` varchar(255) NULL, \`author_id\` int NULL, \`group_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nickname\` varchar(255) NOT NULL, \`social_type\` varchar(255) NOT NULL, \`daily_limit\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`user_share_group\` ADD CONSTRAINT \`FK_6cf3a4583be1e9aa0b748fb24fd\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_share_group\` ADD CONSTRAINT \`FK_839a36d5284440ab7c96fc9ff39\` FOREIGN KEY (\`group_id\`) REFERENCES \`share_group\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`alias\` ADD CONSTRAINT \`FK_4a417cb03bee1a157e40033cca7\` FOREIGN KEY (\`target_id\`) REFERENCES \`target\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`emotion_target\` ADD CONSTRAINT \`FK_023f05c6debf6d73ac26d6c8309\` FOREIGN KEY (\`emotion_id\`) REFERENCES \`emotion\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`emotion_target\` ADD CONSTRAINT \`FK_c4d6b8e61b59bc67bd59ffc9c38\` FOREIGN KEY (\`target_id\`) REFERENCES \`target\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`target\` ADD CONSTRAINT \`FK_d02c3c9dd6b357e16e1ffcdacba\` FOREIGN KEY (\`member_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`diary_emotion_target\` ADD CONSTRAINT \`FK_b8d153de3e307164950858ac431\` FOREIGN KEY (\`diary_id\`) REFERENCES \`diary\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`diary_emotion_target\` ADD CONSTRAINT \`FK_f31c8a6cd321d752e876e0c25b6\` FOREIGN KEY (\`target_id\`) REFERENCES \`target\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`diary\` ADD CONSTRAINT \`FK_1f959f21deabc56761c5cfb8bcf\` FOREIGN KEY (\`author_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`diary\` ADD CONSTRAINT \`FK_e05c4b3493e3428f1d6326d16aa\` FOREIGN KEY (\`group_id\`) REFERENCES \`share_group\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`diary\` DROP FOREIGN KEY \`FK_e05c4b3493e3428f1d6326d16aa\``);
        await queryRunner.query(`ALTER TABLE \`diary\` DROP FOREIGN KEY \`FK_1f959f21deabc56761c5cfb8bcf\``);
        // await queryRunner.query(`ALTER TABLE \`diary_emotion_target\` DROP FOREIGN KEY \`FK_f31c8a6cd321d752e876e0c25b6\``);
        // await queryRunner.query(`ALTER TABLE \`diary_emotion_target\` DROP FOREIGN KEY \`FK_b8d153de3e307164950858ac431\``);
        await queryRunner.query(`ALTER TABLE \`target\` DROP FOREIGN KEY \`FK_d02c3c9dd6b357e16e1ffcdacba\``);
        await queryRunner.query(`ALTER TABLE \`emotion_target\` DROP FOREIGN KEY \`FK_c4d6b8e61b59bc67bd59ffc9c38\``);
        await queryRunner.query(`ALTER TABLE \`emotion_target\` DROP FOREIGN KEY \`FK_023f05c6debf6d73ac26d6c8309\``);
        await queryRunner.query(`ALTER TABLE \`alias\` DROP FOREIGN KEY \`FK_4a417cb03bee1a157e40033cca7\``);
        await queryRunner.query(`ALTER TABLE \`user_share_group\` DROP FOREIGN KEY \`FK_839a36d5284440ab7c96fc9ff39\``);
        await queryRunner.query(`ALTER TABLE \`user_share_group\` DROP FOREIGN KEY \`FK_6cf3a4583be1e9aa0b748fb24fd\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP TABLE \`diary\``);
        // await queryRunner.query(`DROP TABLE \`diary_emotion_target\``);
        await queryRunner.query(`DROP TABLE \`target\``);
        await queryRunner.query(`DROP TABLE \`emotion_target\``);
        await queryRunner.query(`DROP TABLE \`emotion\``);
        await queryRunner.query(`DROP TABLE \`alias\``);
        await queryRunner.query(`DROP TABLE \`share_group\``);
        await queryRunner.query(`DROP TABLE \`user_share_group\``);
    }

}
