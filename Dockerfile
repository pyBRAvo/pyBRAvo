FROM ubuntu:14.04

MAINTAINER Alban Gaignard <alban.gaignard@univ-nantes.fr>

SHELL ["/bin/bash", "-c"]
WORKDIR /home

# Copy repository files to the image
COPY environment.yml .

# Update Ubuntu + basic install
RUN apt-get update
RUN apt-get install -y git curl wget bzip2 libcurl4-openssl-dev libxml2-dev zlib1g-dev

# Install miniconda to /miniconda
RUN curl -LO https://repo.continuum.io/miniconda/Miniconda3-latest-Linux-x86_64.sh
RUN bash Miniconda3-latest-Linux-x86_64.sh -p /my-miniconda -b
RUN rm Miniconda3-latest-Linux-x86_64.sh
ENV PATH=/my-miniconda/bin:${PATH}
RUN conda config --add channels conda-forge
RUN conda config --add channels bioconda
RUN conda env create -n pybravo -f environment.yml

# Copy repository files to the image
COPY README.md .
COPY src src

#CMD [ "bash" ]
CMD /bin/bash -c 'source activate pybravo && jupyter notebook --ip 0.0.0.0 --no-browser --allow-root'
#CMD /bin/bash -c 'source activate pybravo && cd python && nosetests'
