
import fr.symetric.server.models.DAOFactory;
import fr.symetric.server.models.User;
import fr.symetric.server.models.UserRepositoryDAO;
import java.io.File;
import java.io.IOException;
import java.util.Map;
import org.junit.AfterClass;
import static org.junit.Assert.assertTrue;
import org.junit.BeforeClass;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */
public class MongoDBTest {

    private final static Logger logger = LoggerFactory.getLogger(MongoDBTest.class);

    private static Process mongoDB_server = null;

    @BeforeClass
    public static void initiate() throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder("/usr/local/Cellar/mongodb/3.0.1/bin/mongod");
        pb.redirectErrorStream(true);
        mongoDB_server = pb.start();
    }

    @Test
    public void testUserAdd() {
        UserRepositoryDAO uDao = DAOFactory.getUserDAO();

        long counter = uDao.count();
        logger.info("The count is [" + counter + "]");
        User u = new User();
        u.setEmail("myAdmin@univ-nantes.fr");
        u.setName("Michel Dupont");
        uDao.save(u);
        long newCounter = uDao.count();
        logger.info("The new count is [" + newCounter + "]");
        assertTrue((counter + 1) == newCounter);

        uDao.deleteById("myAdmin@univ-nantes.fr");
        logger.info("Deleted user " + u.getName());
        logger.info("The new count is [" + newCounter + "]");
        long lastCounter = uDao.count();
        assertTrue(counter == lastCounter);
    }

    @AfterClass
    public static void tearDownClass() throws Exception {
        if (mongoDB_server != null) {
            mongoDB_server.destroy();
            mongoDB_server = null;
        }
    }
}
