package com.thoughtworks;

import org.jbehave.core.ConfigurableEmbedder;

import java.io.*;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;

public class JukecookerGenerator {

    private String generateHTML(String steps, InputStream htmlTemplateFile) throws IOException {
		StringBuilder htmlBuilder = new StringBuilder();
        String line;

        BufferedReader reader = new BufferedReader(new InputStreamReader(htmlTemplateFile));
        while ((line = reader.readLine()) != null) {
            htmlBuilder.append(line);
            htmlBuilder.append("\n");
        }

        String html = htmlBuilder.toString();
        html = html.replace("#{steps}", steps);

        return html;
	}

	public static void main(String[] args) throws ClassNotFoundException, IOException, URISyntaxException {
		if (args.length < 2) {
			showUsage();
		}

		List<String> stepsList = new ArrayList<String>();
		if (args[0].equalsIgnoreCase("-class")) {
			stepsList = new StepsFinder().findByJBehaveConfiguration((Class<? extends ConfigurableEmbedder>) Class.forName(args[1]));
		} else if (args[0].equalsIgnoreCase("-path")) {
			stepsList = new StepsFinder().findBySourceFiles(new File(args[1]));
		} else {
			showUsage();
		}

		String formattedSteps = new StepsFormatter().format(stepsList);

		String html = new JukecookerGenerator().generateHTML(formattedSteps, JukecookerGenerator.class.getResourceAsStream("/rsc/outputTemplate.html"));

		FileWriter writer = new FileWriter(new File("jukecooker.html"));
		writer.write(html);
		writer.close();

		System.out.println("Generated 'jukecooker.html' with " + stepsList.size() + " steps.");
	}

	private static void showUsage() {
		System.err.println("Usage: jukecooker (-class <JBehave configurable embedder class> | -path <path to steps classes folder>");
		System.exit(1);
	}
}
