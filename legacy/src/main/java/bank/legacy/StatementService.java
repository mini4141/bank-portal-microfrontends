package bank.legacy;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/** Legacy statement rules: oldest first, running balance, totals, fixed page size of 10. */
public class StatementService {

    public static final int PAGE_SIZE = 10;

    public record Line(String date, String description, long debit, long credit, long balance) {}

    public record Statement(String accountId, String month, long opening, long debit, long credit,
                            long closing, int page, int totalPages, int total, List<Line> lines) {}

    private final JsonObject seed;

    public StatementService() {
        try (Reader r = new InputStreamReader(
                StatementService.class.getResourceAsStream("/seed.json"), StandardCharsets.UTF_8)) {
            this.seed = new Gson().fromJson(r, JsonObject.class);
        } catch (Exception e) {
            throw new IllegalStateException("seed.json missing", e);
        }
    }

    public List<String> accountIds() {
        List<String> ids = new ArrayList<>();
        seed.getAsJsonArray("accounts").forEach(a -> ids.add(a.getAsJsonObject().get("id").getAsString()));
        return ids;
    }

    private static long net(JsonObject t) {
        long amount = t.get("amount").getAsLong();
        return "credit".equals(t.get("type").getAsString()) ? amount : -amount;
    }

    /** @param month yyyy-MM */
    public Statement build(String accountId, String month, int page) {
        JsonObject account = null;
        for (var a : seed.getAsJsonArray("accounts")) {
            if (a.getAsJsonObject().get("id").getAsString().equals(accountId)) account = a.getAsJsonObject();
        }
        if (account == null) return null;

        JsonArray all = seed.getAsJsonArray("transactions");
        long opening = account.get("openingBalance").getAsLong();
        List<JsonObject> inMonth = new ArrayList<>();
        for (var e : all) {
            JsonObject t = e.getAsJsonObject();
            if (!t.get("accountId").getAsString().equals(accountId)) continue;
            String date = t.get("date").getAsString();
            if (date.compareTo(month + "-01") < 0) opening += net(t);
            else if (date.startsWith(month)) inMonth.add(t);
        }
        inMonth.sort(Comparator.comparing((JsonObject t) -> t.get("date").getAsString())
                .thenComparing(t -> t.get("id").getAsString()));

        List<Line> lines = new ArrayList<>();
        long running = opening, debit = 0, credit = 0;
        for (JsonObject t : inMonth) {
            running += net(t);
            long amount = t.get("amount").getAsLong();
            boolean isCredit = "credit".equals(t.get("type").getAsString());
            if (isCredit) credit += amount; else debit += amount;
            lines.add(new Line(t.get("date").getAsString(), t.get("description").getAsString(),
                    isCredit ? 0 : amount, isCredit ? amount : 0, running));
        }
        int totalPages = Math.max(1, (lines.size() + PAGE_SIZE - 1) / PAGE_SIZE);
        int p = Math.min(Math.max(1, page), totalPages);
        List<Line> slice = lines.subList((p - 1) * PAGE_SIZE, Math.min(lines.size(), p * PAGE_SIZE));
        return new Statement(accountId, month, opening, debit, credit, running, p, totalPages, lines.size(), slice);
    }
}
