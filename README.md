# 회의록 할 일 정리 (meeting-action-items)

회의가 끝난 뒤 Markdown 회의록을 붙여 넣으면, 누가 언제까지 무엇을 하기로 했는지 할 일 목록으로 정리해 주는 웹 App이다. 규칙으로 정리하며 AI를 호출하지 않는다.

## 지금 상태

초기 골격만 있다. 화면에는 App 이름과 설명만 나오고, 회의록을 읽는 기능은 아직 없다. 기능은 요구 Issue를 하나씩 받아 만든다.

## 실행

```bash
npm install
npm run dev     # 개발 서버
npm test        # 타입 검사, 빌드, 테스트
npm run build   # 배포용 빌드 (dist/)
```

## 저장소 구성

| 경로 | 주인 |
| --- | --- |
| `src/`(아래 `src/self-improvement/` 제외), `test/`, `index.html`, `README.md` | 이 App |
| `src/self-improvement/`, `.framework-runtime/`, `.github/workflows/` 중 Framework workflow, `policy/framework-distribution-ownership.v1.json`, `FRAMEWORK.md` | [AI Development Framework](https://github.com/erpsarang/self-improvement-mvp). 이 저장소에서 고치지 않는다 |

Framework 버전과 개발 흐름은 [`FRAMEWORK.md`](FRAMEWORK.md)에 있다.

## 요구를 남기는 법

GitHub Issue에서 **업무 요구 → AI PLAN** 템플릿을 고르고, 무엇이 불편하고 어떻게 바뀌면 좋은지 적는다. 코드 위치나 구현 방법은 적지 않아도 된다. 최종 Merge는 사람이 한다.
