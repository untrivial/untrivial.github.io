---
layout: page
title: AI safety via debate, OpenAI
description: Replication of OpenAI's "AI safety via debate" paper
img: assets/img/OAISafetyDebateImg.png
importance: 3
category: work
---

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/OAISafetyDebateImg.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

- I set a pair of knight-and-knave agents to compete to convince a classifier judge what the ground truth of an MNIST image is.
- *Data:* Built a custom sparse dataset where each MNIST image is randomly reduced to six non-black pixels.
- *Judge:* Trained a convolutional neural network (CNN) to classify the sparse MNIST images and predict the digit.
- *Agents:* Wrote a custom Monte Carlo Tree Search (MCTS) agent class that learns to play the knight-and-knave game optimally.
- [Link to Python notebook](https://github.com/untrivial/Safety-Via-Debate/blob/main/mnist-debate.ipynb)
