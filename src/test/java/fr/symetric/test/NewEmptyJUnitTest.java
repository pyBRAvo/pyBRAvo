package fr.symetric.test;

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import fr.symetric.server.models.DAOFactory;
import fr.symetric.server.models.ProvMetrics;
import fr.symetric.server.models.ProvMetricsRepositoryDAO;
import java.util.Iterator;
import org.apache.log4j.Logger;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import static org.junit.Assert.*;
import org.mongodb.morphia.query.Query;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class NewEmptyJUnitTest {

    private final static Logger logger = Logger.getLogger(NewEmptyJUnitTest.class);

    public NewEmptyJUnitTest() {
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

    // TODO add test methods here.
    // The methods must be annotated with annotation @Test. For example:
    //
    @Test
    public void hello() {
        ProvMetricsRepositoryDAO dao = DAOFactory.getProvMetricsDAO();

        Query<ProvMetrics> query = dao.createQuery();
        query.order("timeSlot");
        Iterator it = query.iterator();

        String xAxis = "[";
        String y1 = "[";
        String y2 = "[";
        while (it.hasNext()) {
            ProvMetrics p = (ProvMetrics) it.next();
            xAxis += "'" + p.getTimeSlot() + "', ";
            y1 += p.getNbProvTriples() + ", ";
            y2 += p.getNbProvGen() + ", ";
        }
        xAxis = xAxis.substring(0, xAxis.lastIndexOf(","));
        y1 = y1.substring(0, y1.lastIndexOf(","));
        y2 = y2.substring(0, y2.lastIndexOf(","));
        xAxis += "]";
        y1 += "]";
        y2 += "]";

        String jsonTpl = "{\n"
                + "        chart: {\n"
                + "            zoomType: 'xy'\n"
                + "        },\n"
                + "        title: {\n"
                + "            text: 'Galaxy PROV usage statistics'\n"
                + "        },\n"
                + "        xAxis: [{\n"
                + "            categories: " + xAxis + ",\n"
                + "            crosshair: true\n"
                + "        }],\n"
                + "        yAxis: [{ \n"
                + "            labels: {\n"
                + "                format: '{value}',\n"
                + "                style: {\n"
                + "                    color: \"#434348\"\n"
                + "                }\n"
                + "            },\n"
                + "            title: {\n"
                + "                text: 'PROV generations',\n"
                + "                style: {\n"
                + "                    color: \"#434348\"\n"
                + "                }\n"
                + "            }\n"
                + "        }, { \n"
                + "            title: {\n"
                + "                text: 'PROV triples generated',\n"
                + "                style: {\n"
                + "                    color: \"#7cb5ec\"\n"
                + "                }\n"
                + "            },\n"
                + "            labels: {\n"
                + "                format: '{value} triples',\n"
                + "                style: {\n"
                + "                    color: \"#7cb5ec\"\n"
                + "                }\n"
                + "            },\n"
                + "            opposite: true\n"
                + "        }],\n"
                + "        tooltip: {\n"
                + "            shared: true\n"
                + "        },\n"
                + "        legend: {\n"
                + "            layout: 'vertical',\n"
                + "            align: 'left',\n"
                + "            x: 120,\n"
                + "            verticalAlign: 'top',\n"
                + "            y: 100,\n"
                + "            floating: true,\n"
                + "            backgroundColor: '#FFFFFF'\n"
                + "        },\n"
                + "        series: [{\n"
                + "            name: 'PROV triples',\n"
                + "            type: 'spline',\n"
                + "            yAxis: 1,\n"
                + "            data: " + y1 + ",\n"
                + "            tooltip: {\n"
                + "                valueSuffix: ' triples'\n"
                + "            }\n"
                + "\n"
                + "        }, {\n"
                + "            name: 'Runs',\n"
                + "            type: 'column',\n"
                + "            data: " + y2 + ",\n"
                + "            tooltip: {\n"
                + "                valueSuffix: ' runs'\n"
                + "            }\n"
                + "        }]\n"
                + "    }";

        logger.info(jsonTpl);

        Gson gson = new Gson();
        try {
            Object o = gson.fromJson(jsonTpl, Object.class);
            logger.debug(new GsonBuilder().setPrettyPrinting().create().toJson(o));
        } catch (Exception e) {
            e.printStackTrace();
            logger.error("invalid json format");
        }
    }
}
