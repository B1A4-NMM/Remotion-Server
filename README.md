# api-server
http://3.36.95.160:3000/
# How to Use
`git clone https://github.com/B1A4-NMM/Remotion-Server.git`<br>
`npm install`<br>

이 프로젝트는 민감한 정보가 필요합니다. 다음과 같이 .env 파일을 루트 프로젝트 폴더에 만들어 두어야 합니다<br>
`AWS_ACCESS_KEY_ID=...`<br>
`AWS_SECRET_ACCESS_KEY=...`<br>
`AWS_REGION=...`<br>

이후 서버를 실행시킬 수 있습니다.
`npm run dev`<br>
# 아키텍처
![스크린샷 2025-06-24 132102](https://github.com/user-attachments/assets/c1ce1819-79f7-4b73-91a1-da99d0c31c53)
# 기술 스택
- qdrant
- AWS bedrock
- mysql
- nestjs
- typeorm
# 배포 자동화
이 프로젝트에는 aws codedeploy를 이용한 배포 자동화가 적용되어 있습니다
main 브랜치에 push하거나 merge 할 경우 github action을 통해 code-deploy가 작동합니다
