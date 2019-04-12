"""
CONFIG file used to define pyBRAvo main parameters
"""

INPUT_GENES = ['JUN/FOS', 'SCN5A', 'HEY2']

#SPARQL_ENDPOINT = "http://rdf.pathwaycommons.org/sparql/"  # type: str
SPARQL_ENDPOINT = "http://134.158.247.161/sparql/"
CHUNKS_SIZE = 50  # type: int
MAX_DEPTH = 2 # type: int
SKIP_SMALL_MOLECULES = True # type: Bool
#DATA_SOURCES = ['pid', 'humancyc', 'panther', 'msigdb']
DATA_SOURCES = []  # type: List[str]

FAST = True

FINE_GRAINED_SIGNALING_SIF = True

DECOMPOSE_COMPLEXES = False
EXTEND_WITH_SYNONYMS = False
EXTEND_WITH_SUFFIXES = False
VERBOSE = False

HAS_MAX_DEPTH = False
try:
  MAX_DEPTH
except NameError:
  HAS_MAX_DEPTH = False
else:
  HAS_MAX_DEPTH = True

HAS_DATA_SOURCES = False
try:
  DATA_SOURCES
except NameError:
  HAS_DATA_SOURCES = False
else:
  HAS_DATA_SOURCES = True