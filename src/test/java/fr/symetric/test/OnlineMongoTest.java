/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.test;

import com.mongodb.MongoClient;
import fr.symetric.server.models.Activity;
import fr.symetric.server.models.DAOFactory;
import fr.symetric.util.MongoUtil;
import java.util.Calendar;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 *
 * @author Alban Gaignard <alban.gaignard@univ-nantes.fr>
 */
public class OnlineMongoTest {
    
    public OnlineMongoTest() {
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
     public void helloMongo() {
         MongoClient mg = MongoUtil.getMongo();
         int count = 0;
         for (String name : mg.listDatabaseNames()) {
             System.out.println(name);
             count++;
         }
         assertTrue(count >= 1);
     }
     
     @Test
     public void helloDAO() {
         long userCount = DAOFactory.getActivityDAO().count();
         System.out.println(userCount);
         DAOFactory.getActivityDAO().save(new Activity("test", "test", Calendar.getInstance().getTime()));
         long newUserCount = DAOFactory.getActivityDAO().count();
         System.out.println(newUserCount);
         assertEquals(userCount+1, newUserCount);
         
         assertNotNull(MongoUtil.getMongo().getDatabase("symetric_datahub_db"));
     }
}
