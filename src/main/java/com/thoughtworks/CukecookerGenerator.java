package com.thoughtworks;

import org.jbehave.core.ConfigurableEmbedder;

import java.io.*;
import java.util.List;

public class CukecookerGenerator {

    private String generateHTML(String steps, String htmlTemplateFile) throws IOException {
		StringBuilder htmlBuilder = new StringBuilder();
        String line;

        BufferedReader reader = new BufferedReader(new FileReader(htmlTemplateFile));
        while ((line = reader.readLine()) != null) {
            htmlBuilder.append(line);
            htmlBuilder.append("\n");
        }

        String html = htmlBuilder.toString();
        html = html.replace("#{steps}", steps);

        return html;
	}

	public static void main(String[] args) throws ClassNotFoundException, IOException {
        List<String> stepsList = new StepsFinder().findByJBehaveConfiguration((Class<? extends ConfigurableEmbedder>) Class.forName(args[0]));
        String formattedSteps = new StepsFormatter().format(stepsList);

		String html = new CukecookerGenerator().generateHTML(formattedSteps, "./rsc/outputTemplate.html");

		FileWriter writer = new FileWriter(new File("./target/stories.html"));
		writer.write(html);
		writer.close();

        Runtime.getRuntime().exec("cp ./rsc/cukecooker.js ./target/");
	}
}
