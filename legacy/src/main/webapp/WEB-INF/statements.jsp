<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<%@ page import="bank.legacy.EraDate" %>
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>取引明細書 (Legacy)</title>
  <style>
    body { font-family: "MS PGothic", sans-serif; font-size: 13px; margin: 16px; background: #f4f4f0; color: #222; }
    h1 { font-size: 16px; border-bottom: 2px solid #8a1c1c; padding-bottom: 4px; }
    table { border-collapse: collapse; width: 100%; background: #fff; margin-bottom: 8px; }
    th, td { border: 1px solid #999; padding: 3px 6px; }
    th { background: #ddd; }
    td.num { text-align: right; }
    .summary td { background: #fafafa; font-weight: bold; }
    .badge { background: #8a1c1c; color: #fff; padding: 1px 6px; font-size: 11px; }
    form { margin-bottom: 8px; }
  </style>
</head>
<body>
  <h1>取引明細書 <span class="badge">LEGACY JSP</span></h1>
  <form method="get" action="statements">
    口座:
    <select name="account">
      <c:forEach var="id" items="${accountIds}">
        <option value="${id}" ${id == statement.accountId() ? "selected" : ""}>${id}</option>
      </c:forEach>
    </select>
    対象月: <input type="month" name="month" value="${statement.month()}">
    <button type="submit">表示</button>
  </form>

  <table id="summary" class="summary">
    <tr>
      <td>前月繰越</td><td class="num" data-total="opening"><fmt:formatNumber value="${statement.opening()}" pattern="#,##0"/></td>
      <td>お支払合計</td><td class="num" data-total="debit"><fmt:formatNumber value="${statement.debit()}" pattern="#,##0"/></td>
      <td>お預入合計</td><td class="num" data-total="credit"><fmt:formatNumber value="${statement.credit()}" pattern="#,##0"/></td>
      <td>月末残高</td><td class="num" data-total="closing"><fmt:formatNumber value="${statement.closing()}" pattern="#,##0"/></td>
    </tr>
  </table>

  <table id="lines">
    <tr><th>日付</th><th>摘要</th><th>お支払</th><th>お預入</th><th>残高</th></tr>
    <c:forEach var="l" items="${statement.lines()}">
      <tr>
        <td><%= EraDate.format(((bank.legacy.StatementService.Line) pageContext.getAttribute("l")).date()) %></td>
        <td><c:out value="${l.description()}"/></td>
        <td class="num"><c:if test="${l.debit() > 0}">▲<fmt:formatNumber value="${l.debit()}" pattern="#,##0"/></c:if></td>
        <td class="num"><c:if test="${l.credit() > 0}"><fmt:formatNumber value="${l.credit()}" pattern="#,##0"/></c:if></td>
        <td class="num"><fmt:formatNumber value="${l.balance()}" pattern="#,##0"/></td>
      </tr>
    </c:forEach>
  </table>

  <p id="pager">
    <c:if test="${statement.page() > 1}">
      <a href="statements?account=${statement.accountId()}&amp;month=${statement.month()}&amp;page=${statement.page() - 1}">&laquo; 前へ</a>
    </c:if>
    ${statement.page()} / ${statement.totalPages()} ページ (全${statement.total()}件)
    <c:if test="${statement.page() < statement.totalPages()}">
      <a href="statements?account=${statement.accountId()}&amp;month=${statement.month()}&amp;page=${statement.page() + 1}">次へ &raquo;</a>
    </c:if>
  </p>
</body>
</html>
