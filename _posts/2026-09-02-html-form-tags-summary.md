---
layout: article
title: "HTML 폼 관련 태그 정리"
date: 2026-09-02
excerpt: "form의 action/method부터 text·숫자·날짜·라디오·체크박스·select·textarea까지 — 폼 관련 태그와 input 종류를 표와 예제 코드로 정리했다."
---

안녕하세요! 이번에는 `08_폼관련태그.html` 실습에서 배운 폼(form) 관련 태그를 정리해봤습니다.

## 1. form 태그 기본

`form` 태그는 사용자가 값을 입력할 수 있는 양식을 제공하는 태그입니다. 내부의 `input` 태그로 입력받은 데이터를 서버로 전달하는 역할을 합니다.

| 속성 | 역할 |
|---|---|
| `action` | 입력된 값들을 전송받는 서버의 주소 |
| `method="get"` | 서버로 전송하는 방식. URL에 데이터가 그대로 보임 |
| `method="post"` | 서버로 전송하는 방식. URL에 데이터가 감춰짐 |

```html
<form action="search" method="post">
    <label>검색할 내용:</label>
    <input type="text" name="search" required>
    <button type="submit">검색</button>
</form>
```

## 2. text 계열 input 태그

| type | 역할 |
|---|---|
| `text` | 한 줄짜리 텍스트를 입력하는 상자 |
| `password` | 입력한 값이 가려지는 비밀번호 상자 |
| `search` | 검색어 입력 상자 |
| `email` | 이메일 형식 입력 상자 |

```html
<label for="userId">아이디 : </label>
<input type="text" id="userId" name="userId" size="60" placeholder="아이디를 입력해주세요">

<label>비밀번호 : </label>
<input type="password" name="userPwd" size="40" placeholder="비밀번호를 입력해주세요">
```

## 3. 숫자 관련 input 태그

| type | 역할 | 주요 속성 |
|---|---|---|
| `number` | 숫자만 입력 | `min`, `max`, `value`, `step`(증감 단위) |
| `range` | 슬라이더로 숫자 선택 | `min`, `max`, `value` |

```html
<label>수량 : </label>
<input type="number" name="amount" min="0" max="10" value="0" step="3">

<label>점수 : </label>
<input type="range" name="point" min="0" max="100" value="10">
```

## 4. 날짜/시간 관련 input 태그

| type | 역할 |
|---|---|
| `date` | 연-월-일 선택 |
| `month` | 연-월 선택 |
| `week` | 연-주차 선택 |
| `time` | 시:분 선택 |
| `datetime-local` | 날짜 + 시간(현지 시간) 선택 |

```html
<label>date : </label><input type="date" name="date">
<label>time : </label><input type="time" name="time">
<label>datetime-local : </label><input type="datetime-local" name="datetime-local">
```

## 5. 라디오 버튼과 체크박스

| 구분 | 특징 |
|---|---|
| `radio` | `name` 값이 같은 것끼리 그룹으로 묶여서 하나만 선택 가능 |
| `checkbox` | 여러 개를 동시에 선택 가능. `checked` 속성으로 기본 선택 지정 |

```html
<label>성별 : </label>
<input id="male" type="radio" name="gender" value="남성">
<label for="male">남성</label>
<input id="female" type="radio" name="gender" value="여성">
<label for="female">여성</label>

<label>취미 : </label>
<input type="checkbox" id="baseball" name="hobby1" value="야구" checked>
<label for="baseball">야구</label>
```

## 6. select와 option 태그

여러 옵션 중 하나(또는 여러 개)를 고르는 드롭다운 목록 태그입니다.

| 속성 | 역할 |
|---|---|
| `selected` (option) | 기본으로 선택되어 있는 옵션 지정 |
| `size` (select) | 한 번에 보여줄 옵션 개수 |
| `multiple` (select) | 여러 옵션을 동시에 선택 가능하게 함 |

```html
<select name="nation">
    <option value="ko">한국</option>
    <option value="ch">중국</option>
    <option value="jp" selected>일본</option>
    <option value="etc">그 외</option>
</select>
```

> 옵션에 보이는 "한국", "중국" 같은 글자는 사용자를 위한 표시일 뿐이고, 실제로 서버에 전달되는 값은 `value` 속성(`ko`, `ch` 등)입니다.

## 7. 그 밖의 input 태그

| type | 역할 |
|---|---|
| `color` | 색상 선택 |
| `file` | 파일 선택 (`multiple`로 여러 개 선택 가능) |
| `hidden` | 화면에는 안 보이지만 값은 함께 전송됨 |

`button` 태그는 `type`을 지정하지 않으면 기본값이 `submit`이라, 폼 안에서 실수로 페이지를 새로고침시키는 원인이 될 수 있습니다.

```html
<button type="button">버튼</button>   <!-- 그냥 버튼 -->
<button type="submit">버튼2</button>  <!-- 폼 전송 -->
<button>버튼3</button>                <!-- 타입 생략 시 submit과 동일 -->
```

## 8. textarea 태그

`input type="text"`와 비슷하지만, `input`은 한 줄만 입력할 수 있는 반면 `textarea`는 여러 줄을 입력할 수 있고 세로 크기 조절도 가능합니다.

```html
<textarea cols="50" rows="10"></textarea>
```

## 9. 전체 태그 한눈에 보기

| 분류 | 주요 type / 태그 |
|---|---|
| 텍스트 | `text`, `password`, `search`, `email` |
| 숫자 | `number`, `range` |
| 날짜/시간 | `date`, `month`, `week`, `time`, `datetime-local` |
| 선택 | `radio`, `checkbox`, `select` + `option` |
| 기타 | `color`, `file`, `hidden`, `textarea`, `button` |

## 마무리

폼 관련 태그를 한 문장으로 정리하면 이렇습니다.

> `form`이 데이터를 어디로(`action`), 어떻게(`method`) 보낼지 정하고, 그 안의 `input`/`select`/`textarea`가 실제 입력 값을 만든다.

다음에는 이 폼 태그들을 실제로 서버와 주고받는 방법을 정리해볼 예정입니다.
