/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.server;

import com.sun.jersey.spi.container.servlet.ServletContainer;
import java.io.File;
import static java.lang.ProcessBuilder.Redirect.to;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import org.apache.commons.cli.BasicParser;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.Options;
import org.apache.commons.cli.HelpFormatter;
import org.apache.commons.cli.Option;
import org.apache.commons.cli.ParseException;
import org.apache.commons.vfs.AllFileSelector;
import org.apache.commons.vfs.FileDepthSelector;
import org.apache.commons.vfs.FileObject;
import org.apache.commons.vfs.FileSystemException;
import org.apache.commons.vfs.VFS;
import org.apache.commons.io.FileUtils;
import org.mortbay.jetty.Handler;
import org.mortbay.jetty.Server;
import org.mortbay.jetty.handler.ContextHandler;
import org.mortbay.jetty.handler.HandlerList;
import org.mortbay.jetty.handler.ResourceHandler;
import org.mortbay.jetty.servlet.Context;
import org.mortbay.jetty.servlet.ServletHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Embedded HTTP server for Corese. Using Jetty implementation.
 *
 * @author alban.gaignard@cnrs.fr
 */
public class EmbeddedJettyServer {

    private static Logger logger = LoggerFactory.getLogger(EmbeddedJettyServer.class);
    private static String dataPath = null;
//    private static ScheduledExecutorService scheduledExecutorService = Executors.newScheduledThreadPool(5);

    public static void main(String args[]) throws Exception {

        //Concurent tasks to be executed periodically
        
//        ScheduledFuture scheduledFuture = scheduledExecutorService.schedule(new Callable() {
//            public Object call() throws Exception {
//                logger.info("Running periodic session cleaning");
//                DatahubUtils.tagExpiredSessions();
//                DatahubUtils.deleteExpiredSessions();
//                return "Periodic session cleaning done.";
//            }
//        }, 60, TimeUnit.SECONDS);

        Options options = new Options();
        Option portOpt = new Option("p", "port", true, "specify the server port");
        Option helpOpt = new Option("h", "help", false, "print this message");
        Option versionOpt = new Option("v", "version", false, "print the version information and exit");
        options.addOption(portOpt);
        options.addOption(helpOpt);
        options.addOption(versionOpt);

        String header = "Once launched, the server can be managed through a web user interface, available at http://localhost:<PortNumber>\n\n";
        String footer = "\nPlease report any issue to alban.gaignard@cnrs.fr";

        try {
            CommandLineParser parser = new BasicParser();
            CommandLine cmd = parser.parse(options, args);
            if (cmd.hasOption("h")) {
                HelpFormatter formatter = new HelpFormatter();
                formatter.printHelp("datahup-api server", header, options, footer, true);
                System.exit(0);
            }
            if (cmd.hasOption("p")) {
                DatahubUtils.setServerPort(Integer.parseInt(cmd.getOptionValue("p")));
            }
            if (cmd.hasOption("v")) {
                logger.info("version 0.0.1");
                System.exit(0);
            }

            if (cmd.hasOption("l")) {
                dataPath = cmd.getOptionValue("l");
                System.out.println("Server: " + dataPath);
            }

            URI webappUri = EmbeddedJettyServer.extractResourceDir("webapp", true);
            Server server = new Server(DatahubUtils.getServerPort());

            ServletHolder jerseyServletHolder = new ServletHolder(ServletContainer.class);
            jerseyServletHolder.setInitParameter("com.sun.jersey.config.property.resourceConfigClass", "com.sun.jersey.api.core.PackagesResourceConfig");
            jerseyServletHolder.setInitParameter("com.sun.jersey.config.property.packages", "fr.symetric.api");
            jerseyServletHolder.setInitParameter("requestBufferSize", "8192");
            jerseyServletHolder.setInitParameter("headerBufferSize", "8192");
            jerseyServletHolder.setInitParameter("com.sun.jersey.api.json.POJOMappingFeature", "true");
            jerseyServletHolder.setInitParameter("com.sun.jersey.spi.container.ResourceFilters", "fr.symetric.server.ResourceFilterFactory");
            Context servletCtx = new Context(server, "/", Context.SESSIONS);
            servletCtx.addServlet(jerseyServletHolder, "/*");

            logger.info("----------------------------------------------");
            logger.info("SyMeTRIC sandbox API started on http://localhost:" + DatahubUtils.getServerPort() + "/sandbox");
            logger.info("SyMeTRIC queryAPI started on http://localhost:" + DatahubUtils.getServerPort() + "/query");
            logger.info("----------------------------------------------");

            ResourceHandler resource_handler = new ResourceHandler();
//            resource_handler.setWelcomeFiles(new String[]{"index.html"});
            resource_handler.setResourceBase(webappUri.getRawPath());
//            resource_handler.setResourceBase("/Users/gaignard/Documents/Dev/symetric-api-server/src/main/resources/webapp");
            ContextHandler staticContextHandler = new ContextHandler();
            staticContextHandler.setContextPath("/");
            staticContextHandler.setHandler(resource_handler);
            logger.info("----------------------------------------------");
            logger.info("SyMeTRIC sandbox webapp UI started on http://localhost:" + DatahubUtils.getServerPort());
            logger.info("----------------------------------------------");

            HandlerList handlers = new HandlerList();
            handlers.setHandlers(new Handler[]{staticContextHandler, servletCtx});
            server.setHandler(handlers);

            server.start();
            server.join();
        } catch (ParseException exp) {
            System.err.println("Parsing failed.  Reason: " + exp.getMessage());
        }
    }

    public static URI extractResourceDir(String dirname, boolean overwrite) throws FileSystemException, URISyntaxException {
        URL dir_url = EmbeddedJettyServer.class.getClassLoader().getResource(dirname);
        FileObject dir_jar = VFS.getManager().resolveFile(dir_url.toString());
        String tempDir = FileUtils.getTempDirectory() + File.separator + System.getProperty("user.name");
        FileObject tmpF = VFS.getManager().resolveFile(tempDir);
        FileObject localDir = tmpF.resolveFile(dirname);
        if (!localDir.exists()) {
            logger.info("Extracting directory " + dirname + " to " + tmpF.getName());
            localDir.createFolder();
            localDir.copyFrom(dir_jar, new AllFileSelector());
        } else {
            if (overwrite) {
                logger.info("Overwritting directory " + dirname + " in " + tmpF.getName());
                localDir.delete(new FileDepthSelector(0, 5));
                localDir.createFolder();
                localDir.copyFrom(dir_jar, new AllFileSelector());
            }
        }
        return localDir.getURL().toURI();
    }
}
