/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

import com.github.jmchilton.blend4j.galaxy.GalaxyInstance;
import com.github.jmchilton.blend4j.galaxy.GalaxyInstanceFactory;
import com.github.jmchilton.blend4j.galaxy.HistoriesClient;
import com.github.jmchilton.blend4j.galaxy.ToolsClient;
import com.github.jmchilton.blend4j.galaxy.beans.History;
import com.github.jmchilton.blend4j.galaxy.beans.HistoryContents;
import com.github.jmchilton.blend4j.galaxy.beans.HistoryContentsProvenance;
import java.util.List;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Ignore;
import org.junit.Test;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class GalaxyApiTest {

    public GalaxyApiTest() {
    }

    @BeforeClass
    public static void setUpClass() {
    }

    @AfterClass
    public static void tearDownClass() {
    }

    @Before
    public void setUp() {
    }

    @After
    public void tearDown() {
    }

//    private static String gURL = "http://galaxy-bird.univ-nantes.fr";
//    private static String gApiKey = "5f5c875829e4ac6afae64ba31225cdee";

    private static String gURL_local = "http://localhost:8080";
    private static String gApiKey_local = "a6309f84ad5d4c39bfd41758efce4aaf";

    // TODO add test methods here.
    // The methods must be annotated with annotation @Test. For example:
    //
    @Test
    @Ignore
    public void hello() {
        //my API Key 5f5c875829e4ac6afae64ba31225cdee
//        GalaxyInstance galaxyInstance = GalaxyInstanceFactory.get(gURL, gApiKey,true);
        GalaxyInstance galaxyInstance = GalaxyInstanceFactory.get(gURL_local, gApiKey_local);
//        LibrariesClient lib = galaxyInstance.getLibrariesClient();
//        for (Library l : lib.getLibraries()) {
//            System.out.println(l.getName());
//        }

        ToolsClient toolsClient = galaxyInstance.getToolsClient();
        HistoriesClient historiesClient = galaxyInstance.getHistoriesClient();

        for (History history : historiesClient.getHistories()) {
            String name = history.getName();
            String historyId = history.getId();
            String message = String.format("Found history with name %s and id %s", name, historyId);
            System.out.println(message);

            List<HistoryContents> hCont = historiesClient.showHistoryContents(historyId);
            System.out.println("*******************************");
            System.out.println("*******************************");
            for (HistoryContents c : hCont) {
                System.out.println(c.getName() + " :: " + c.getUrl() + " :: " + c.getHistoryContentType() + " :: " + c.getId());
                String datasetId = c.getId();
                HistoryContentsProvenance hProv = historiesClient.showProvenance(historyId, datasetId);
                System.out.println("\t" + hProv.getToolId());
                System.out.println("\t" + hProv.getJobId());
                System.out.println("\t" + hProv.getStandardOutput());
                System.out.println("\t" + hProv.getStandardError());
            }
        }
    }
}
