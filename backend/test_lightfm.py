import numpy as np
from lightfm import LightFM
from scipy.sparse import csr_matrix

print("Import successful")
try:
    model = LightFM(loss='warp')
    print("Model instantiated")
    # Tiny dummy data
    data = csr_matrix([[1, 0], [0, 1]])
    print("Fitting model...")
    model.fit(data, epochs=1)
    print("Fit successful!")
except Exception as e:
    print(f"Error: {e}")
