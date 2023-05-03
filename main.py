from flask import Flask
from flask import request
import json
import dill
import re
import pandas as pd
import tensorflow as tf
from underthesea import word_tokenize
import pickle
from keras.models import load_model
from underthesea import classify
#################################
# Các hàm tiền xử lý dữ liệu từ file notebook

with open("19.4.23/vn-stopword.txt",encoding='utf-8') as file:
    stopwords = file.readlines()
    stopwords = [word.rstrip() for word in stopwords]

punctuations = '''!()-–=[]{}“”‘’;:'"|\,<>./?@#$%^&*_~'''

special_chars = ['\n', '\t']

regex = re.compile(
        r'^(?:http|ftp)s?://' # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|' # domain
        r'localhost|' # localhost
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})' # ip
        r'(?::\d+)?' # port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)

def tokenize(text):
    tokenized_text = word_tokenize(text)
    return tokenized_text
def is_punctuation(token):
    global punctuations
    return True if token in punctuations else False
def is_special_chars(token):
    global special_chars
    return True if token in special_chars else False
def is_link(token):
    return re.match(regex, token) is not None
def lowercase(token):
    return token.lower()
def is_stopword(token):
    global stopwords
    return True if token in stopwords else False
def vietnamese_text_preprocessing(text):
    tokens = tokenize(text)
    tokens = [token for token in tokens if not is_punctuation(token)]
    tokens = [token for token in tokens if not is_special_chars(token)]
    tokens = [token for token in tokens if not is_link(token)]
    tokens = [lowercase(token) for token in tokens]
    tokens = [token for token in tokens if not is_stopword(token)]
    return tokens


###################################
with open('19.4.23/tokenizer.pkl', 'rb') as handle:
    tokenizer_saved = pickle.load(handle)
with open('19.4.23/tfidf_vector.pkl', 'rb') as in_strm:
    saved_tfidf = dill.load(in_strm)
with open('19.4.23/nb-model.pkl', 'rb') as in_strm:
    saved_nb = dill.load(in_strm)
with open('19.4.23/tree-model.pkl', 'rb') as in_strm:
    saved_tree = dill.load(in_strm)
with open('19.4.23/svc-model.pkl', 'rb') as in_strm:
    saved_svc = dill.load(in_strm)
model_rnn = load_model("19.4.23/rnn-model_final.h5")
model_rnn.compile()

model_dict = {
        "Naive Bayes": "NB",
        "Decision Tree": "DT",
        "SVM": "SVM",
        "RNN": "RNN"
    }
####################################################
# Hàm dự đoán
def model_predict(model, text):
    if (model == 'RNN'):
        print('RNN')
        text = ' '.join(vietnamese_text_preprocessing(text))
        text = tokenizer_saved.texts_to_sequences([text])
        text = tf.keras.preprocessing.sequence.pad_sequences(text, padding='post', maxlen=256)
        pred_text = model_rnn.predict(text)[0][0]
        print(pred_text)
        if pred_text < 0.5:
            return 0
        else:
            return 1
    else:
        print("ML")
        model_pd = ' '.join(vietnamese_text_preprocessing(text))
        tfid_text = saved_tfidf.transform([model_pd])
        if model == 'SVM':
            print("SVC")
            return saved_svc.predict(tfid_text)[0]
        elif model == 'NB':
            print("NB")
            return saved_nb.predict(tfid_text)[0]
        else:
            print("DT")
            return saved_tree.predict(tfid_text)[0]

##############################################################################################
app = Flask(__name__)
@app.route("/api/predict",methods=['POST'])
def predict():
    record = json.loads(request.data)
    if(record['text']==''):
        return '2'
    else:
        pred_rs = model_predict(record['model'], record['text'])
        rs = str(pred_rs)+";"+"".join(classify(record['text']))
        print(rs)
        return rs

app.run(port=8888, host = '0.0.0.0')