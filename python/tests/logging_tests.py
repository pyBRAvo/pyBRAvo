import unittest
import logging, sys
import bravo.util as util

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s: %(message)s', stream=sys.stdout)


class TestLogging(unittest.TestCase):

    def setUp(self) -> None:
        logging.info("Logger intialized")

    def test_logging(self):
        logging.getLogger().setLevel(logging.DEBUG)
        logging.debug("Message should be shown")

    def test_logging_disabled(self):
        logging.getLogger().setLevel(logging.CRITICAL)
        logging.info("Message should not be shown")
        logging.critical("Message")

    def tearDown(self) -> None:
        logging.info("End of unit test")


if __name__ == '__main__':
    unittest.main()