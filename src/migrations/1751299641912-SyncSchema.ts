import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncSchema1751299641912 implements MigrationInterface {
    name = 'SyncSchema1751299641912'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`activity\` DROP FOREIGN KEY \`FK_72474a2a98dfaed94a7e067b828\``);
        await queryRunner.query(`CREATE TABLE \`diary_emotion\` (\`id\` int NOT NULL AUTO_INCREMENT, \`emotion\` enum ('행복', '기쁨', '신남', '설렘', '유대', '신뢰', '존경', '친밀', '자신감', '서운', '평온', '안정', '편안', '시기', '소외', '불안', '실망', '기대', '속상', '상처', '감사', '무난', '차분', '긴장', '화남', '짜증', '무기력', '지침', '지루', '억울', '외로움', '우울', '공허', '초조', '부담', '어색', '불편', '단절') NOT NULL DEFAULT '무난', \`intensity\` int NOT NULL, \`diaryId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`diary\` CHANGE \`weather\` \`weather\` enum ('SUNNY', 'CLOUDY', 'RAINY', 'SNOWY', 'STORMY', 'WINDY', 'SMOG', 'NONE') NOT NULL DEFAULT 'SUNNY'`);
        await queryRunner.query(`ALTER TABLE \`activity\` ADD CONSTRAINT \`FK_72474a2a98dfaed94a7e067b828\` FOREIGN KEY (\`diaryId\`) REFERENCES \`diary\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`diary_emotion\` ADD CONSTRAINT \`FK_07af10c7980a36210c2e251e90e\` FOREIGN KEY (\`diaryId\`) REFERENCES \`diary\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`diary_emotion\` DROP FOREIGN KEY \`FK_07af10c7980a36210c2e251e90e\``);
        await queryRunner.query(`ALTER TABLE \`activity\` DROP FOREIGN KEY \`FK_72474a2a98dfaed94a7e067b828\``);
        await queryRunner.query(`ALTER TABLE \`diary\` CHANGE \`weather\` \`weather\` enum ('SUNNY', 'CLOUDY', 'RAINY', 'SNOWY', 'STORMY', 'WINDY') NOT NULL DEFAULT 'SUNNY'`);
        await queryRunner.query(`DROP TABLE \`diary_emotion\``);
        await queryRunner.query(`ALTER TABLE \`activity\` ADD CONSTRAINT \`FK_72474a2a98dfaed94a7e067b828\` FOREIGN KEY (\`diaryId\`) REFERENCES \`diary\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
