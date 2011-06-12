package com.thoughtworks;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class StepsFormatter {

    public String format(List<String> stepList) {
		StringBuilder builder = new StringBuilder();
        String parametersRegex = "\\$[a-zA-Z]([a-zA-Z]|\\d|_|-)*";
        Pattern pattern = Pattern.compile(parametersRegex);

        boolean first = true;
        for (String step : stepList) {
            if (!first) {
                builder.append(",\n");
            }
            builder.append("[\"");

            String stepText = step;
            StringBuilder parameterList = new StringBuilder();
            Matcher m = pattern.matcher(step);

            if (m.find()) {
                parameterList.append(", [");
                boolean firstParameter = true;
                do {
                    String parameter = m.group();
                    String parameterName = parameter.replace("$", "");
                    stepText = stepText.replace(parameter, "$" + parameterName + "$");
                    if (!firstParameter) {
                        parameterList.append(", ");
                    }
                    parameterList.append("\"");
                    parameterList.append(parameterName);
                    parameterList.append("\"");
                    firstParameter = false;
                } while (m.find());
                parameterList.append("]");
            }

            builder.append(stepText);
            builder.append("\"");
            builder.append(parameterList.toString());

            builder.append("]");
            first = false;
        }

		return builder.toString();
	}
}
