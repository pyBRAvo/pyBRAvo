import unittest
import logging, sys
import bravo.util as util

logger = logging.getLogger()
logger.level = logging.DEBUG
formatter = logging.Formatter('%(asctime)s - %(message)s')
stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setFormatter(formatter)
logger.addHandler(stream_handler)


class TestGeneNames(unittest.TestCase):

    def test_suffix_expansion(self):
        expanded = util.expandGeneNames(['LAMA2'])
        print(*expanded, sep=", ")
        self.assertTrue(len(expanded) == 12)


if __name__ == '__main__':
    unittest.main()