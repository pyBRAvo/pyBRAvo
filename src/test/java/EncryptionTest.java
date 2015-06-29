/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

import java.math.BigInteger;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import org.jasypt.digest.StandardStringDigester;
import org.jasypt.util.password.ConfigurablePasswordEncryptor;
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
public class EncryptionTest {

    public EncryptionTest() {
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
    // @Test
    // public void hello() {}
    @Test
    public void simpleEncryption() {
        StandardStringDigester digester = new StandardStringDigester();
        digester.setAlgorithm("SHA-1");   // optionally set the algorithm
        digester.setIterations(50000); // increase security by performing 50000 hashing iterations
        digester.setSaltSizeBytes(8);
        String digest = digester.digest("myPass");

        String encryptedPassword = digest;
        System.out.println("myPass");
        System.out.println(encryptedPassword);

        StandardStringDigester digester2 = new StandardStringDigester();
        digester2.setAlgorithm("SHA-1");   // optionally set the algorithm
        digester2.setIterations(50000); // increase security by performing 50000 hashing iterations
        digester2.setSaltSizeBytes(8);
        
        if (digester2.matches("myPass", encryptedPassword)) {
            System.out.println("OK");
        } else {
            System.out.println("KO");
        }
    }
}
