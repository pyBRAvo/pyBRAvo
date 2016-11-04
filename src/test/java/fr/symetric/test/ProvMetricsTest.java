package fr.symetric.test;

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

import fr.symetric.server.models.DAOFactory;
import fr.symetric.server.models.ProvMetrics;
import fr.symetric.server.models.ProvMetricsRepositoryDAO;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class ProvMetricsTest {

    public ProvMetricsTest() {
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

    @Test
    public void hello() {
        String timeSlot = "1900-01";

        ProvMetricsRepositoryDAO dao = DAOFactory.getProvMetricsDAO();
        dao.deleteById(timeSlot);

        dao.traceInsertedTriples(250, timeSlot);
        dao.traceInsertedTriples(100, timeSlot);

        ProvMetrics pm = dao.get(timeSlot);

        Assert.assertEquals(2, pm.getNbProvGen());
        Assert.assertEquals(350, pm.getNbProvTriples());

        dao.deleteById(timeSlot);
        Assert.assertNull(dao.get(timeSlot));
    }

    @Test
    public void genChart() {
        
        ProvMetricsRepositoryDAO dao = DAOFactory.getProvMetricsDAO();
        String xAxis = "[";
        String y1 = "[";
        String y2 = "[";
        for (String id : dao.findIds()) {
            xAxis += "'"+id+"', ";
            y1 += dao.get(id).getNbProvTriples()+", ";
            y2 += dao.get(id).getNbProvGen()+", ";
        }
        xAxis = xAxis.substring(0, xAxis.lastIndexOf(","));
        y1 = y1.substring(0, y1.lastIndexOf(","));
        y2 = y2.substring(0, y2.lastIndexOf(","));
        xAxis += "]";
        y1 += "]";
        y2 += "]";
        
        System.out.println(xAxis);
        System.out.println(y1);
        System.out.println(y2);
        
        String jsonTpl = "{\n"
                + "        chart: {\n"
                + "            zoomType: 'xy'\n"
                + "        },\n"
                + "        title: {\n"
                + "            text: 'Galaxy PROV usage statistics'\n"
                + "        },\n"
                + "        xAxis: [{\n"
                + "            categories: "+xAxis+",\n"
                + "            crosshair: true\n"
                + "        }],\n"
                + "        yAxis: [{ // Primary yAxis\n"
                + "            labels: {\n"
                + "                format: '{value}',\n"
                + "                style: {\n"
                + "                    color: Highcharts.getOptions().colors[1]\n"
                + "                }\n"
                + "            },\n"
                + "            title: {\n"
                + "                text: 'PROV generations',\n"
                + "                style: {\n"
                + "                    color: Highcharts.getOptions().colors[1]\n"
                + "                }\n"
                + "            }\n"
                + "        }, { // Secondary yAxis\n"
                + "            title: {\n"
                + "                text: 'PROV triples generated',\n"
                + "                style: {\n"
                + "                    color: Highcharts.getOptions().colors[0]\n"
                + "                }\n"
                + "            },\n"
                + "            labels: {\n"
                + "                format: '{value} triples',\n"
                + "                style: {\n"
                + "                    color: Highcharts.getOptions().colors[0]\n"
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
                + "            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'\n"
                + "        },\n"
                + "        series: [{\n"
                + "            name: 'PROV triples',\n"
                + "            type: 'spline',\n"
                + "            yAxis: 1,\n"
                + "            data: "+y1+",\n"
                + "            tooltip: {\n"
                + "                valueSuffix: ' triples'\n"
                + "            }\n"
                + "\n"
                + "        }, {\n"
                + "            name: 'Runs',\n"
                + "            type: 'column',\n"
                + "            data: "+y2+",\n"
                + "            tooltip: {\n"
                + "                valueSuffix: ' runs'\n"
                + "            }\n"
                + "        }]\n"
                + "    }";
        System.out.println(jsonTpl);
    }
}
