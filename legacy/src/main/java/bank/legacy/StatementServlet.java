package bank.legacy;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;

@WebServlet(urlPatterns = "/statements")
public class StatementServlet extends HttpServlet {

    private final StatementService service = new StatementService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Cookie[] cookies = Optional.ofNullable(req.getCookies()).orElse(new Cookie[0]);
        if (Arrays.stream(cookies).noneMatch(c -> "bk_session".equals(c.getName()))) {
            resp.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Sign in through the portal first");
            return;
        }
        String account = Optional.ofNullable(req.getParameter("account")).orElse("acc-001");
        String month = Optional.ofNullable(req.getParameter("month")).orElse("2026-10");
        int page = 1;
        try {
            page = Integer.parseInt(req.getParameter("page"));
        } catch (NumberFormatException ignored) {
            // default to the first page
        }
        StatementService.Statement statement = service.build(account, month, page);
        if (statement == null) {
            resp.sendError(HttpServletResponse.SC_NOT_FOUND, "Unknown account");
            return;
        }
        req.setAttribute("statement", statement);
        req.setAttribute("accountIds", service.accountIds());
        req.getRequestDispatcher("/WEB-INF/statements.jsp").forward(req, resp);
    }
}
