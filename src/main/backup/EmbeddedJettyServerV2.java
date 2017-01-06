/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.server;

import java.io.File;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
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
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.ContextHandler;
import org.eclipse.jetty.server.handler.ContextHandlerCollection;
import org.eclipse.jetty.server.handler.DefaultHandler;
import org.eclipse.jetty.server.handler.ResourceHandler;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.glassfish.jersey.servlet.ServletContainer;
//import org.eclipse.jetty.server.Handler;
//import org.eclipse.jetty.server.Server;
//import org.eclipse.jetty.server.handler.ContextHandler;
//import org.eclipse.jetty.server.handler.ContextHandlerCollection;
//import org.eclipse.jetty.server.handler.DefaultHandler;
//import org.eclipse.jetty.server.handler.HandlerList;
//import org.eclipse.jetty.server.handler.ResourceHandler;
//import org.eclipse.jetty.servlet.ServletContextHandler;
//import org.eclipse.jetty.servlet.ServletHolder;

/**
 * Embedded HTTP server for Corese. Using Jetty implementation.
 *
 * @author alban.gaignard@cnrs.fr
 */
public class EmbeddedJettyServerV2 {

    private static Logger logger = Logger.getLogger(EmbeddedJettyServerV2.class);
    private static String dataPath = null;
//    private static ScheduledExecutorService scheduledExecutorService = Executors.newScheduledThreadPool(5);

    public static void main(String args[]) throws Exception {

        Logger mongoLogger = Logger.getLogger("com.mongodb");
        mongoLogger.setLevel(Level.OFF); // e.g. or Log.WARNING, etc.

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

            URI webappUri = EmbeddedJettyServerV2.extractResourceDir("web", true);
            Server server = new Server(DatahubUtils.getServerPort());

            ServletHolder jerseyServletHolder = new ServletHolder(ServletContainer.class);
            jerseyServletHolder.setInitParameter("com.sun.jersey.config.property.resourceConfigClass", "com.sun.jersey.api.core.PackagesResourceConfig");
            jerseyServletHolder.setInitParameter("com.sun.jersey.config.property.packages", "fr.symetric.api");
            jerseyServletHolder.setInitParameter("requestBufferSize", "8192");
            jerseyServletHolder.setInitParameter("headerBufferSize", "8192");
            jerseyServletHolder.setInitParameter("com.sun.jersey.api.json.POJOMappingFeature", "true");
            jerseyServletHolder.setInitParameter("com.sun.jersey.spi.container.ResourceFilters", "fr.symetric.server.ResourceFilterFactory");

            ServletContextHandler servletCtx = new ServletContextHandler(ServletContextHandler.SESSIONS);
            servletCtx.setContextPath("/");
            servletCtx.addServlet(jerseyServletHolder, "/*");
//
////            
////            HttpConfiguration https = new HttpConfiguration();
////            https.addCustomizer(new SecureRequestCustomizer());
////            SslContextFactory sslContextFactory = new SslContextFactory();
////            sslContextFactory.setKeyStorePath(EmbeddedJettyServer.class.getResource("/keystore.jks").toExternalForm());
////            sslContextFactory.setKeyStorePassword("123456");
////            sslContextFactory.setKeyManagerPassword("123456");
////            ServerConnector sslConnector = new ServerConnector(server,
////                    new SslConnectionFactory(sslContextFactory, "http/1.1"),
////                    new HttpConnectionFactory(https));
////            sslConnector.setPort(9998);
//            logger.info("----------------------------------------------");
//            logger.info("SyMeTRIC sandbox API started on http://localhost:" + DatahubUtils.getServerPort() + "/sandbox");
//            logger.info("SyMeTRIC queryAPI started on http://localhost:" + DatahubUtils.getServerPort() + "/query");
//            logger.info("----------------------------------------------");
//
            ResourceHandler resource_handler = new ResourceHandler();
            resource_handler.setDirectoriesListed(true);
            resource_handler.setWelcomeFiles(new String[]{"index.html"});
            resource_handler.setResourceBase(webappUri.getRawPath());
//            resource_handler.setResourceBase("/Users/gaignard-a/Documents/Dev/symetric-api-server/src/main/resources/webapp");
//
            ContextHandler staticContextHandler = new ContextHandler();
            staticContextHandler.setContextPath("/*");
            staticContextHandler.setHandler(resource_handler);
            
            logger.info("----------------------------------------------");
            logger.info("SyMeTRIC sandbox webapp UI started on http://localhost:" + DatahubUtils.getServerPort());
            logger.info("----------------------------------------------");

            ContextHandlerCollection contexts = new ContextHandlerCollection();
            contexts.setHandlers(new Handler[]{staticContextHandler, servletCtx, new DefaultHandler()});
            server.setHandler(contexts);

            server.start();
            server.join();
        } catch (ParseException exp) {
            System.err.println("Parsing failed.  Reason: " + exp.getMessage());
        }
    }

    public static URI extractResourceDir(String dirname, boolean overwrite) throws FileSystemException, URISyntaxException {
        URL dir_url = EmbeddedJettyServerV2.class.getClassLoader().getResource(dirname);
        FileObject dir_jar = VFS.getManager().resolveFile(dir_url.toString());
        String tempDir = FileUtils.getTempDirectory() + File.separator + System.getProperty("user.name");
        FileObject tmpF = VFS.getManager().resolveFile(tempDir);
        FileObject localDir = tmpF.resolveFile(dirname);
        if (!localDir.exists()) {
            logger.info("Extracting directory " + dirname + " to " + tmpF.getName());
            localDir.createFolder();
            localDir.copyFrom(dir_jar, new AllFileSelector());
        } else if (overwrite) {
            logger.info("Overwritting directory " + dirname + " in " + tmpF.getName());
            localDir.delete(new FileDepthSelector(0, 5));
            localDir.createFolder();
            localDir.copyFrom(dir_jar, new AllFileSelector());
        }
        return localDir.getURL().toURI();
    }
}
