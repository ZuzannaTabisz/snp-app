FROM python:3.9 AS backend

# libraries instalation
RUN apt-get update && apt-get install -y --no-install-recommends \
    bc \
    ghostscript \
    texlive-font-utils \
    pdf2svg \
    poppler-utils \ 
    liblapack-dev \
    liblapacke-dev \
    liblapack3 \
    libgsl-dev \
    libmpfr-dev \
    nodejs \
    npm \
    libgraphviz-dev \
    graphviz \
    && npm install -g svgo \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# installing ViennaRNA from .deb
COPY pipeline/viennarna_2.7.0-1_amd64.deb viennarna_2.7.0-1_amd64.deb
RUN dpkg -i viennarna_2.7.0-1_amd64.deb

# installing python requirements
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# setting working directory
WORKDIR /usr/src/backend

# copying files
COPY . .

# changing permissions
RUN chmod -R 777 pipeline

# app port
EXPOSE 8080

# running app
CMD ["python", "app.py"]
