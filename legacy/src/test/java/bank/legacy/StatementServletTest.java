package bank.legacy;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class StatementServletTest {

    @Test
    void rendersStatementTotalsForOctober() throws Exception {
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse resp = mock(HttpServletResponse.class);
        RequestDispatcher dispatcher = mock(RequestDispatcher.class);
        when(req.getCookies()).thenReturn(new Cookie[] {new Cookie("bk_session", "x")});
        when(req.getParameter("account")).thenReturn("acc-001");
        when(req.getParameter("month")).thenReturn("2026-10");
        when(req.getParameter("page")).thenReturn("1");
        when(req.getRequestDispatcher("/WEB-INF/statements.jsp")).thenReturn(dispatcher);

        new StatementServlet().doGet(req, resp);

        ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
        verify(req).setAttribute(eq("statement"), captor.capture());
        StatementService.Statement s = (StatementService.Statement) captor.getValue();
        assertEquals(StatementService.PAGE_SIZE, s.lines().size());
        assertEquals(s.opening() + s.credit() - s.debit(), s.closing());
        verify(dispatcher).forward(any(), any());
    }

    @Test
    void formatsEraDates() {
        assertEquals("令和8年11月3日", EraDate.format("2026-11-03"));
    }
}
