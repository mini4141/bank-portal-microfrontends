package bank.legacy;

import java.time.LocalDate;

/** Legacy quirk: dates are shown in the Japanese era calendar, e.g. 令和8年11月3日. */
public final class EraDate {
    private EraDate() {}

    public static String format(String isoDate) {
        LocalDate d = LocalDate.parse(isoDate);
        if (d.isBefore(LocalDate.of(2019, 5, 1))) return isoDate;
        return "令和" + (d.getYear() - 2018) + "年" + d.getMonthValue() + "月" + d.getDayOfMonth() + "日";
    }
}
